import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'yalla_driver_offline_v1';
const STORE_NAME = 'operation_queue';

export interface QueuedOperation {
    id: string;
    type: 'accept_order' | 'status_update';
    payload: any;
    timestamp: number;
}

export const OfflineQueue = {
    private_db: null as IDBPDatabase | null,

    async getDB() {
        if (this.private_db) return this.private_db;
        this.private_db = await openDB(DB_NAME, 1, {
            upgrade(db) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            },
        });
        return this.private_db;
    },

    async enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp'>) {
        const db = await this.getDB();
        const op: QueuedOperation = {
            ...operation,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };
        await db.add(STORE_NAME, op);
        return op;
    },

    async getAll() {
        const db = await this.getDB();
        return db.getAll(STORE_NAME);
    },

    async remove(id: string) {
        const db = await this.getDB();
        await db.delete(STORE_NAME, id);
    },

    /**
     * 🛡 8️⃣ RECONCILIATION STRATEGY
     * Processes the queue when back online.
     */
    async processQueue(processor: (op: QueuedOperation) => Promise<void>) {
        const ops = await this.getAll();
        for (const op of ops) {
            try {
                await processor(op);
                await this.remove(op.id);
            } catch (err) {
                console.error("[OfflineQueue] Failed to process operation:", op.id, err);
                // If it's a conflict error (already accepted), we remove it
                if (err instanceof Error && err.message.includes("already taken")) {
                    await this.remove(op.id);
                }
            }
        }
    }
};
