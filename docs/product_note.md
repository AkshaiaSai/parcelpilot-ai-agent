# ParcelPilot Internal Support Agent — Product Note

## 1. Product Problem & Vision

In high-velocity logistics operations, support teams deal with fragmented information across legacy policies, customer contracts, known system defects, and unstructured ticket histories. Junior agents frequently make costly mistakes by:
1. Repeating outdated policy rules or incorrect guidance from historical tickets.
2. Missing customer-specific contract overrides that waive fees or define custom SLAs.
3. Prematurely executing irreversible actions (refunds, cancellations, credits) without proper authorization.

**ParcelPilot OpsAgent** transforms logistics operations by functioning as an intelligent, source-grounded co-pilot for Tier-1 and Tier-2 staff.

---

## 2. Bonus Feature Selection: Trust & Reliability + Proactive Intelligence

### Primary Choice: Trust & Reliability
We prioritized **Trust & Reliability** as the foundational pillar of the system:
- **Transparent Source Attribution**: Every response explicitly cites the document version, section, or database record utilized.
- **Explicit Conflict Calling**: If a customer's contract overrides standard SOP, the agent highlights:
  > *"Standard SOP v4 prescribes a ₹250 fee, but under Northstar's Enterprise Agreement Section 2.1, pre-pickup cancellation fees are waived."*
- **Trap Defense**: The system detects when historical resolutions (e.g., TKT-450, TKT-451) contradict ground truth and proactively points out the error to prevent perpetuating misinformation.
- **Calibration of Confidence**: When data is insufficient or requires discretionary judgment, the agent declines to guess and proposes an escalation to a human manager.

### Secondary Choice: Proactive Radar
The `SignalsPanel` surfaces real-time telemetry anomalies directly into the operator workspace:
1. **P1 Security Alerts**: Instant detection of leaked credentials (TKT-505) with immediate revocation playbooks.
2. **Systemic Pattern Recognition**: Correlating multi-account complaints (TKT-502 + TKT-451 + KI-208) to recognize platform bugs rather than misdiagnosing user error.
3. **SLA Breach Warnings**: Automated computation of elapsed time vs. tier target SLAs.

---

## 3. Scope & Deliberate Exclusions

To maximize code correctness, safety, and reliability within the assessment scope, the following were intentionally left out:
- **Direct Autonomous Action Execution**: The agent is structurally barred from executing database updates or escalations directly; all state changes must be confirmed via operator modal.
- **Arbitrary External Web Crawling**: The knowledge base is strictly limited to verified enterprise documentation to prevent external hallucinations.
- **Full Auth Server / OAuth2 Infrastructure**: Replaced with clean role-based mock persona switching (Rohit vs. Maya) to focus on structural data scoping rather than authentication boilerplate.

---

## 4. North Star Metric: Operational Accuracy Rate (OAR)

### Primary Metric: **Zero-Defect Operational Accuracy Rate (OAR)**
$$\text{OAR} = \frac{\text{Queries resolved with 100\% ground-truth accuracy and correct source hierarchy}}{\text{Total queries processed}}$$

### Why this metric?
In B2B logistics, giving a customer incorrect contractual advice or erroneously charging cancellation fees damages enterprise trust and causes revenue leakage. Reaching $>99\%$ OAR ensures operators can rely on the agent as a trusted source of truth.
