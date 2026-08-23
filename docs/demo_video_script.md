# ParcelPilot OpsAgent — Demo Video Walkthrough Script

**Duration**: ~3–4 minutes  
**Audience**: Technical evaluators & hiring managers  
**Goal**: Demonstrate source hierarchy reasoning, two-phase action execution, access control scoping, and proactive intelligence detection.

---

## Act 1: Introduction & Architecture (0:00 – 0:45)
- **Visual**: Start at the Login Screen (`http://localhost:3000`).
- **Narrator**:
  > *"Welcome to ParcelPilot OpsAgent — an internal AI assistant designed to solve a critical problem in logistics: reasoning over imperfect data packs where contracts override standard policies, policies get updated, and past ticket histories contain flawed advice."*
- **Action**: Highlight the two operator personas (Rohit - Support Agent vs. Maya - Ops Manager). Select **Rohit Sharma** and click **Access Internal Portal**.

---

## Act 2: Contract Hierarchy & Overrides (0:45 – 1:45)
- **Visual**: Dashboard opens.
- **Action**: Click on the quick prompt chip: *"Can Northstar cancel ORD-1001 without a cancellation fee? Explain why."*
- **Narrator**:
  > *"Notice how the agent engages in multi-step reasoning. It calls `query_structured_data` to inspect ORD-1001, identifies the account as Northstar Logistics (ACCT-001), and then searches `search_documents` for both standard SOPs and Northstar's Enterprise Agreement."*
- **Visual**: Point out the tool badges (`📄 Document Search`, `🗄️ Data Lookup`) at the top of the message bubble.
- **Narrator**:
  > *"Crucially, the agent explains that while Standard SOP v4 requires a fee for cancellations made >30 minutes after booking, Northstar's signed Enterprise Agreement Section 2.1 strictly overrides this policy to ₹0 for all pre-pickup cancellations."*

---

## Act 3: Time Calculation & LumenWorks Credit Override (1:45 – 2:30)
- **Action**: Submit prompt: *"Check order ORD-2002 for LumenWorks. The pickup was missed due to carrier fault. What service credit is due, and why?"*
- **Narrator**:
  > *"Watch the temporal reasoning: the agent calculates that between the pickup window end time (06:30) and our snapshot time (11:00), 4.5 hours have elapsed. Under LumenWorks' contract, missed pickups over 4 hours with carrier fault receive a flat ₹300 credit, overriding the standard ₹500/10% calculation."*

---

## Act 4: Two-Phase Action Safety & Security Escalation (2:30 – 3:15)
- **Action**: Click the prompt for **TKT-505 (API Key Exposure)**.
- **Narrator**:
  > *"For urgent security incidents like TKT-505, the agent flags this as a P1 Critical incident and proposes a credential revocation action."*
- **Visual**: The message displays a **Pending Action Proposed** card (`⚡ Action Proposed`).
- **Action**: Click **Review** $\rightarrow$ Confirm Action Modal appears $\rightarrow$ Click **Authorize Action**.
- **Narrator**:
  > *"Because irreversible actions require human oversight, the agent cannot execute actions silently in the same turn. The operator reviews the details and authorizes the change."*

---

## Act 5: Proactive Radar & Conclusion (3:15 – 3:45)
- **Visual**: Focus on the right-hand **Proactive Radar** sidebar.
- **Action**: Highlight the P1 Security incident, the bulk upload pattern correlation (linking TKT-502, TKT-451, and KI-208), and breached SLAs.
- **Narrator**:
  > *"With full source grounding, robust RBAC data scoping, two-phase action execution, and proactive anomaly detection, ParcelPilot OpsAgent delivers enterprise reliability out of the box."*
