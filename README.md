# 📦 ParcelPilot AI Internal Support Agent

An assessment-grade full-stack AI Operations & Support Agent built with **FastAPI**, **LangGraph**, **ChromaDB**, **SQLite**, and **Next.js 14 + Tailwind CSS**.

The system helps ParcelPilot operations and support personnel answer customer questions and take actions by reasoning over imperfect data packs where customer contracts override standard policies, policies get deprecated, and past ticket histories contain flawed advice.

---

## 🌟 Key Features

1. **Hierarchy of Truth & Source Grounding**:
   $$\text{Signed Customer Contract} \succ \text{Current Policies (v3/v4)} \succ \text{Product Guides} \succ \text{Historical Tickets (Context Only)}$$
   - Explicitly cites sources and calls out overrides.
   - Detects and corrects historical resolution errors (e.g., TKT-450, TKT-451).
   - Deprecated policy isolation (v2 policy never cited as current).

2. **Native Tool Calling via LangGraph**:
   - `search_documents`: Semantic search over chunked PDF policies and contracts with metadata filters.
   - `query_structured_data`: Safe, parameterized SQL query builder with snapshot time calculation (`2026-08-16 11:00 IST`).
   - `create_action`: Two-phase pending action creation.

3. **Two-Phase Action Authorization**:
   - The agent proposes actions (`create_escalation`, `update_ticket`, `create_follow_up_task`) in a `pending` state.
   - Requires explicit human operator authorization via the UI confirmation modal before execution.

4. **Structural Access Control & RBAC**:
   - Mock personas: **Rohit Sharma** (Support Agent) and **Maya Patel** (Ops Manager).
   - Data scoping enforced at the code layer via SQL `WHERE` clause injection.

5. **Proactive Intelligence Radar**:
   - Real-time detection of P1 security incidents (TKT-505 API key leak).
   - Correlation of multi-ticket patterns with known issues (TKT-502 + TKT-451 + KI-208).
   - Automated SLA breach calculation against plan targets.

6. **Classy Enterprise Next.js UI**:
   - Dark theme with Tailwind CSS, Inter typography, tool execution badges, markdown rendering, and proactive signals panel.

---

## 📁 Repository Structure

```
parcelpilot-ai-agent/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point & CORS
│   │   ├── config.py                  # Environment config & constants
│   │   ├── agent/
│   │   │   ├── graph.py               # LangGraph StateGraph & tool loop
│   │   │   ├── prompts.py             # System prompt & hierarchy rules
│   │   │   └── state.py               # TypedDict state definition
│   │   ├── tools/
│   │   │   ├── document_search.py     # Semantic search over ChromaDB
│   │   │   ├── structured_data.py     # Parameterized SQLite query engine
│   │   │   └── actions.py             # Two-phase action proposal & execution
│   │   ├── data/
│   │   │   ├── ingest_structured.py   # xlsx -> SQLite ingestion
│   │   │   ├── ingest_documents.py    # PDFs -> ChromaDB vector ingestion
│   │   │   └── raw/                   # 6 PDFs + 1 xlsx data pack
│   │   ├── access_control/
│   │   │   └── auth.py                # Mock auth & structural data scoping
│   │   ├── signals/
│   │   │   └── proactive_detection.py # P1 security, patterns & SLA breaches
│   │   ├── routers/
│   │   │   ├── auth.py                # POST /auth/login
│   │   │   ├── chat.py                # POST /chat
│   │   │   ├── actions.py             # POST /actions/confirm, POST /actions/cancel
│   │   │   └── signals.py             # GET /signals
│   │   └── models/
│   │       └── schemas.py             # Pydantic request/response schemas
│   ├── storage/                       # Generated SQLite DB & vectorstore
│   ├── tests/
│   │   ├── test_access_control.py     # RBAC & scoping unit tests
│   │   ├── test_tools.py              # Tool execution & action tests
│   │   └── test_agent_scenarios.py    # End-to-end scenario reasoning tests
│   ├── scripts/
│   │   └── setup.sh                   # Ingestion pipeline runner
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with Inter font
│   │   ├── page.tsx                   # Main dashboard layout
│   │   └── globals.css                # Enterprise styling & markdown css
│   ├── components/
│   │   ├── ChatWindow.tsx             # Main chat feed & prompt chips
│   │   ├── MessageBubble.tsx          # Markdown message bubble & badges
│   │   ├── ToolBadge.tsx              # Tool execution visual pill
│   │   ├── ConfirmActionModal.tsx     # Operator action confirmation dialog
│   │   ├── SignalsPanel.tsx           # Proactive detection sidebar
│   │   └── LoginMock.tsx              # Operator persona switcher
│   ├── lib/
│   │   └── api.ts                     # API client for backend
│   ├── types/
│   │   └── chat.ts                    # TypeScript definitions
│   ├── package.json
│   ├── tailwind.config.ts
│   └── Dockerfile
└── docs/
    ├── architecture_note.md           # LangGraph & tool architecture details
    ├── product_note.md                # Product trade-offs & OAR metric
    └── demo_video_script.md           # Walkthrough script for demo recording
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **OpenAI API Key**

---

### Step 1: Backend Setup

1. **Navigate to the backend directory and create a virtual environment**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt sentence-transformers langchain-text-splitters
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside `backend/`:
   ```bash
   cp .env.example .env
   ```
   Add your OpenAI API key:
   ```ini
   OPENAI_API_KEY=sk-proj-your-openai-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   ```

4. **Run Data Ingestion**:
   ```bash
   ./scripts/setup.sh
   ```
   *This populates the SQLite database (`storage/parcelpilot.db`) and vector store (`storage/vectorstore`).*

5. **Run the Test Suite**:
   ```bash
   pytest tests/ -v
   ```
   *(All 11 tests validate access control, tools, and edge-case scenarios).*

6. **Start the Backend Server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

### Step 2: Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🐳 Docker Deployment (Optional)

Run the entire full-stack application with a single command:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🧪 Benchmark Verification Scenarios

| Scenario | Question / Test | Expected Reasoning & Output |
|---|---|---|
| **Contract Overrides** | *"Can Northstar cancel ORD-1001 without a cancellation fee? Explain why."* | Identifies ACCT-001 contract Section 2.1 which overrides SOP v4 and waives cancellation fees pre-pickup. |
| **Late Pickup Calculation** | *"Check order ORD-2002 for LumenWorks. The pickup was missed due to carrier fault. What credit is due?"* | Calculates pickup window end (06:30) to snapshot (11:00) as 4.5h ($>4$h) and awards contract-specific ₹300 credit. |
| **Data Trap Avoidance** | *"What is the maximum bulk upload row limit for LumenWorks on Growth plan?"* | Clarifies the limit is **5,000 rows**; points out KI-208 bug at 3,000 rows and notes that historical ticket TKT-451 was incorrect. |
| **Security Escalation** | *"Look up ticket TKT-505. What severity is this, and what action should be taken?"* | Identifies leaked API key as **P1 Critical** security incident, advises immediate credential revocation, and proposes an escalation action. |
| **Two-Phase Action** | Proposing any escalation or ticket update | Creates a pending action card in the chat $\rightarrow$ Requires clicking "Authorize Action" modal before execution. |
