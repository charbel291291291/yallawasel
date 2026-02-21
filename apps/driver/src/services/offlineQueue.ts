import { openDB } from 'idb';
import { QueuedOperation } from '../types';
import { supabase } from '../services/supabaseClient';

const DB_NAME = 'driver_offline_ops';
const STORE_NAME = 'ops_queue';

export const OfflineQueue = {
    async init() {
        return openDB(DB_NAME, 1, {
            upgrade(db) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            },
        });
    },

    async enqueue(op: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>) {
        return this.push(op.type, op.payload);
    },

    async push(type: QueuedOperation['type'], payload: any) {
        const db = await this.init();
        const op: QueuedOperation = {
            id: crypto.randomUUID(),
            type,
            payload,
            timestamp: Date.now(),
            retryCount: 0
        };
        await db.put(STORE_NAME, op);
        this.process(); // Try processing immediately
        return op.id;
    },

    async processQueue(handler?: (op: QueuedOperation) => Promise<void>) {
        return this.process(handler);
    },

    async process(handler?: (op: QueuedOperation) => Promise<void>) {
        console.log("[OfflineQueue] Processing suppressed for stability debugging");
        return;
        /*
        if (!navigator.onLine) return;

        const db = await this.init();
        const ops = await db.getAll(STORE_NAME);

        for (const op of ops) {
            try {
                let success = false;

                if (handler) {
                    await handler(op);
                    success = true;
                } else {
                    if (op.type === 'location_update') {
                        const { error } = await supabase.from('drivers').upsert(op.payload);
                        if (!error) success = true;
                    }

                    if (op.type === 'status_update') {
                        const { error } = await supabase.from('orders').update(op.payload.update).eq('id', op.payload.id);
                        if (!error) success = true;
                    }

                    // For accept_order, we might need a handler since it uses OrderService
                }

                if (success) {
                    await db.delete(STORE_NAME, op.id);
                } else {
                    op.retryCount++;
                    if (op.retryCount > 10) await db.delete(STORE_NAME, op.id); // Give up
                    else await db.put(STORE_NAME, op);
                }
            } catch (err) {
                console.error("[OfflineQueue] Failed to process op:", op.id, err);
            }
        }
        */
    }
};

// Process on online event disabled
// window.addEventListener('online', () => OfflineQueue.process());
// setInterval(() => OfflineQueue.process(), 30000); // Background retry every 30s
