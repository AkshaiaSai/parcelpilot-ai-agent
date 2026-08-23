# ParcelPilot Internal Support Agent — Architecture Note

## 1. System Architecture Overview

The ParcelPilot AI Internal Support Agent is built as a modular, decoupled full-stack application designed to empower operations and support personnel with source-grounded answers and controlled action capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js + Tailwind UI                    │
│   (Role Selector, Multi-step Chat, Action Modals, Radar)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (HTTP)
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI API Gateway                      │
│   /chat   /auth/login   /actions/confirm   /signals         │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Access       │       │ LangGraph    │       │ Proactive    │
│ Control      │       │ Agent Loop   │       │ Intelligence │
│ Layer        │       │ (StateGraph) │       │ Detection    │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       │                      ▼                      │
       │       ┌──────────────────────────────┐      │
       │       │ 3 Distinct LangChain Tools    │      │
       │       │ • search_documents           │      │
       │       │ • query_structured_data      │      │
       │       │ • create_action (2-phase)    │      │
       │       └──────────────┬───────────────┘      │
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              ▼
        ┌───────────────────────────────────────────┐
        │ Data & Knowledge Layer                    │
        │ • ChromaDB (PDF Vectorstore with Metadata)│
        │ • SQLite DB (Accounts, Orders, Tickets)   │
        │ • Action Log (Pending & Audited Actions)  │
        └───────────────────────────────────────────┘
```

---

## 2. Agent & Reasoning Design (LangGraph)

The core reasoning orchestrator is built on **LangGraph** (`StateGraph`) using OpenAI's native tool calling via `langchain-openai` (`ChatOpenAI` targeting `gpt-4o-mini`).

### State Machine Architecture
- **`AgentState`**: Manages `messages`, `user_context` (scoped account IDs, operator privileges), `tools_used` (pills passed to frontend), and `pending_actions`.
- **Cyclic Tool Loop**: `agent_node` $\rightarrow$ `should_continue` conditional edge $\rightarrow$ `tool_node` $\rightarrow$ `agent_node` until the LLM decides no further tool calls are necessary.
- **Safety Limits**: Hard iteration cap (`MAX_AGENT_ITERATIONS = 10`) prevents runaway recursions or token exhaustion.

---

## 3. Hierarchy of Truth & Conflict Resolution

The system prompt enforces a rigid source hierarchy to resolve discrepancies:

$$\text{Signed Customer Contract} \succ \text{Current Policies (v3/v4)} \succ \text{Product Ops Guides} \succ \text{Historical Tickets (Context Only)}$$

### Specific Edge Case Handlers
1. **Contract Overrides (e.g., Northstar ACCT-001)**:
   - *Default SOP*: Fee applies if cancelled $>30$ mins after booking.
   - *Northstar Contract*: Explicitly overrides SOP to ₹0 cancellation fee for any pre-pickup cancellation.
   - *Result*: The agent identifies the signed contract and waives the fee.
2. **Contract-Specific Credit Terms (e.g., LumenWorks ACCT-002)**:
   - *Default SOP*: Lower of ₹500 or 10% of shipment fee if missed pickup.
   - *LumenWorks Contract*: Fixed ₹300 credit if carrier fault $>4$ hours late.
   - *Result*: The agent calculates elapsed time from pickup window end (06:30) to snapshot time (11:00) as 4.5 hours ($>4$h) and awards ₹300.
3. **Data Trap Avoidance (TKT-450, TKT-451)**:
   - Past tickets contained erroneous human agent guidance (e.g., telling Northstar a ₹250 fee applied, or claiming Growth upload limit is 3,000 rows).
   - The agent treats past ticket resolutions as historical context, detects contradictions with current documentation/contracts, and cites the correct ground truth.
4. **Deprecated Policy Isolation**:
   - `02_Support_Policy_v2_DEPRECATED.pdf` chunks are tagged `status="deprecated"` in ChromaDB metadata. The agent never cites v2 as current truth.

---

## 4. Tool Design & Security Scoping

### Tool 1: `search_documents`
- Hybrid retrieval with strict metadata filtering (`source_type`, `status`, `account_scope`).
- Structural scoping: filters `account_scope` in code to prevent unauthorized contract access.

### Tool 2: `query_structured_data`
- Constrained parameterized query builder over SQLite (whitelist of allowed tables, columns, and operators).
- Immune to SQL injection (no raw SQL execution permitted).
- Includes deterministic date/time calculation functions relative to the dataset snapshot timestamp (`2026-08-16 11:00 IST`).
- Injects `WHERE account_id IN (...)` at the data access layer.

### Tool 3: `create_action` (Two-Phase Verification)
- **Phase 1 (Propose)**: The agent invokes `create_action` which registers a `pending` record in `action_log` with an identifier (`ACT-XXXXXXXX`) and returns a preview. The agent cannot execute the action in the same turn.
- **Phase 2 (Authorize)**: Human operator must click "Authorize Action" in the UI modal, triggering `POST /actions/confirm`.

---

## 5. Architectural Trade-offs & Decisions

| Decision | Alternative Considered | Rationale |
|---|---|---|
| **Local HuggingFace Embeddings (`all-MiniLM-L6-v2`)** | OpenAI Embedding API | Eliminates external API dependencies for vector search, guaranteeing full offline reproducibility and zero token cost during retrieval. |
| **Constrained Parameterized SQL Builder** | Text-to-SQL (NL2SQL) | LLM-generated raw SQL is prone to hallucination, schema poisoning, and destructive mutations. Parameterized query builders enforce 100% deterministic safety. |
| **Strict Structural Access Scoping** | System Prompt Scoping ("Please only view ACCT-001") | Prompt instructions are vulnerable to prompt injections or jailbreaks. Code-level WHERE clause injection guarantees absolute data isolation. |
