# 🏦 Zero-Trust Financial Core Architecture (V1.0)
**Principal FinTech Security Architect:** Zero-Trust Infrastructure Group
**Subject:** Yalla Wasel Production Ledger Hardening

## 1. Zero-Trust Architecture Overview
Conventional database security relies on "Perimeter RLS". This architecture introduces **Internal Zero-Trust**, assuming that even with authorized access, every mutation must be cryptographically chained and ledger-validated. This system treats `wallet_balance` not as a source of truth, but as a **cached derivation** of an immutable ledger.

### The Five Invariants:
1.  **Immutability:** No financial record can be updated or deleted. Ever.
2.  **Chain of Trust:** Every transaction is cryptographically linked to the previous one (Hash Chaining).
3.  **Mutation Eras:** Balance updates only happen through the **Ledger Mutation Trigger**.
4.  **Replay Resistance:** Idempotency keys and nonces prevent double-spend or duplicate processing.
5.  **Dual-Approval:** High-value manual adjustments require "Two-Key" authorization.

---

## 2. Ledger Model & Double-Entry Accounting
We transition to an **Append-Only Ledger**. 
- **Source of Truth:** `financial_ledger` table.
- **Derived View:** `profiles.wallet_balance` acts as a materialized cache for UI performance, but is validated daily against the ledger.

---

## 3. Cryptographic Integrity System
Each ledger entry contains:
*   `payload_hash`: SHA256 of the current transaction details.
*   `previous_hash`: The `entry_hash` of the record immediately preceding it.
*   `entry_hash`: `SHA256(payload_hash + previous_hash)`.
This creates a **State Chain**. If a single bit is changed in a historical record, the entire chain after it "breaks", allowing for instant tamper detection.

---

## 4. Internal Threat Mitigation
To protect against an "Admin-with-DB-Access" threat:
*   **Hash Anchors:** Daily cryptographic anchors of the ledger are exported to cold storage.
*   **Dual-Approval:** Manual credits > $50 are queued in `pending_approvals` and require a second Admin's UID to execute.

---

## 5. Risk Matrix Evolution
| Threat Vector | Previous State | Zero-Trust State |
| :--- | :--- | :--- |
| **Balance Manipulation** | Easy (Direct Table Update) | **Blocked (Trigger Enforced)** |
| **History Deletion** | Possible (Delete row) | **Impossible (Breaks Hash Chain)** |
| **Replay Attack** | Vulnerable | **Prevented (Idempotency Key)** |
| **Insider Fraud** | High Exposure | **Mitigated (Dual-Approval)** |

---

*Refer to `supabase/migrations/008_zero_trust_financial_core.sql` for the final implementation pack.*
