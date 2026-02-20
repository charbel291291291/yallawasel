# 🧠 Autonomous Evolution Layer (V1.0)
**Principal Systems Architect:** AI Evolution Systems Group
**Target:** Yalla Wasel Governance Framework

## 1. Architecture Overview
The Autonomous Evolution Layer (AEL) moves our security from "Reactive Hardening" to "Proactive Learning". It is a deterministic, feedback-driven system that recalibrates the system's defenses based on real-world outcomes. It treats the security configuration as a dynamic state that evolves through empirical evidence.

### Core Governance Principles:
1.  **Deterministic Learning:** No stochastic "Black Box" AI. Every adjustment follows inspectable calculus.
2.  **Stability First (Damping):** All self-adjustments are dampened to prevent oscillatory threshold behavior.
3.  **Explainable Mitigation:** Every user restriction can be traced back to specific metrics and the then-current weights.
4.  **Anti-Runaway Guardrails:** Hard caps on how much the system can change itself per window.

---

## 2. Weight Adaptation Engine
The system uses a **Precision-Weighted Adjustment** model.
*   **High Precision Anomalies:** If an anomaly type consistently flags true positives, its weight is boosted toward the `max_weight`.
*   **Noisy Anomalies:** If an anomaly type has a high false-positive rate, its weight is automatically suppressed to reduce user friction.

---

## 3. Graduated Mitigation Model
We replace the binary "Freeze" with a **4-Tier Escalation State Machine**:

| Level | State | Trigger Score | Action |
| :--- | :--- | :--- | :--- |
| **0** | Green | < 30 | None |
| **1** | Yellow | 30 - 50 | **Soft Throttle:** Dynamic Rate Limiting applied. |
| **2** | Orange | 51 - 80 | **Transaction Delay:** Forced 3s processing lag to kill bot bursts. |
| **3** | Red | 81 - 100 | **Soft Freeze:** Wallet debit blocked; requires review. |
| **4** | Black | > 100 | **Hard Hold:** All mutations blocked + SMS alert to Security. |

---

## 4. Stability & Anti-Runaway Safeguards
*   **Daily Velocity Cap:** Weights cannot change by more than 15% in a single 24-hour period.
*   **Threshold Anchoring:** If the system attempts to move a threshold more than 2x from its `base_weight`, an `ADMIN_OVERSIGHT_REQUIRED` event is generated.
*   **Baseline Exclusion:** Statistical "Spikes" are automatically excluded from the 30-day moving average to prevent attackers from "training" the baseline toward abuse.

---

## 5. Audit & Explainability Layer
Every evolution step is recorded in the `evolution_log`.
- **Explain Query:** `SELECT * FROM explain_user_restriction(user_id)` returns a human-readable summary of why a user was throttled, including the specific weights at the time of detection.

---

*Refer to `supabase/migrations/009_autonomous_evolution_layer.sql` for the final implementation pack.*
