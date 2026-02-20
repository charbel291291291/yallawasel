# 🏛️ Sovereign-Grade Resilient Architecture (V2.0)
**Principal Architect:** AI Resilience Systems Group
**Tier:** Sovereign-Grade (survives regional failure & ledger tampering)

## 1. Sovereign Architecture Overview
This architecture transitions Yalla Wasel from a "Cloud Application" to a **"Sovereign Financial Entity"**. It assumes the cloud region might fail, the fraud models will drift, and the primary ledger must be forensically verifiable.

### The Three Pillars of Sovereignty:
1.  **Logical Regional Failover:** Strategic logical validation during infrastructure switchover.
2.  **Adaptive Fraud Equilibrium:** A feedback-driven engine that learns from admin decisions to reduce false positives.
3.  **Forensic Proof-of-State:** Immutable snapshotting with cryptographic hashing to prevent "Insider Tampering".

---

## 2. Phase 1: Regional Failover Simulation
Regional recovery is 10% infrastructure and 90% logic validation.

### Failover Blueprint:
- **RTO (Recovery Time):** < 30 Minutes.
- **RPO (Recovery Point):** < 1 Hour.
- **Strategy:** Supabase Read Replica promotion followed by a **Sovereignty Drill**.
- **The Sovereignty Drill:** An automated logic check that ensures RLS/RPC state is consistent in the new region before traffic is allowed.

---

## 3. Phase 2: Fraud Feedback & Model Drift
Fraudsters adapt, and so must we.

### Feedback Loop Mechanism:
*   **True Positive:** Increases the specific anomaly weight in `fraud_config`.
*   **False Positive:** Triggers a weight reduction and recalibrates the user's `activity_baseline`.
*   **Drift Detection:** If the "Global Average Risk Score" shifts by > 25% in 48h, the system flags a "Model Drift" anomaly for architect review.

---

## 4. Phase 3: Immutable Audit Snapshot
Prevents the "History Erasure" attack where an insider with DB access deletes audit logs.

### Forensic Protection:
*   **Cryptographic Anchoring:** Every 24 hours, the system generates a SHA256 "ledger hash". 
*   **External Witnessing:** This hash is exported to a separate "Witness Storage" (Cold S3). 
*   **Tamper Detection:** If the current audit table hash doesn't match the historical anchor, the system identifies the exact window of tampering.

---

## 5. Risk Matrix Evolution
| Threat Vector | V1.0 (Hardened) | V2.0 (Sovereign) |
| :--- | :--- | :--- |
| **Regional Outage** | 2-4h Recovery | < 30m Validated Failover |
| **Fraud Model Drift** | Manual Tuning | Autonomous Adaptation |
| **Insider Ledger Wipe** | Detected (Log) | Crypto-Verifiable Proof |
| **State Corruption** | DB Revert | Forensic Replay & Recovery |

---

*Refer to `supabase/migrations/007_sovereign_resilience.sql` for the final implementation pack.*
