"""
Proactive Detection — surfaces urgent patterns and issues from the data.

Detects:
1. P1 Security incidents (e.g., TKT-505 API key exposure)
2. Recurring patterns (e.g., bulk upload failures across tickets + known issues)
3. SLA breach risks (tickets approaching/exceeding SLA based on plan + severity)
"""

import json
import sqlite3
from datetime import datetime, timezone, timedelta

from app.config import SQLITE_DB_PATH, SNAPSHOT_TIMESTAMP

IST = timezone(timedelta(hours=5, minutes=30))
SNAPSHOT_DT = datetime.fromisoformat(SNAPSHOT_TIMESTAMP)

# SLA targets from current policy v3 (hours)
SLA_TARGETS = {
    "Enterprise": {"P1": 1, "P2": 4, "P3": 8},
    "Growth": {"P1": 2, "P2": 8, "P3": 24},
    "Standard": {"P1": 4, "P2": 12, "P3": 48},
}

# Heuristic severity classification based on ticket content
SEVERITY_KEYWORDS = {
    "P1": ["security", "api key", "exposure", "all shipment", "all users", "production down",
           "data breach", "unauthorized", "critical"],
    "P2": ["fails", "failing", "error", "not working", "stuck", "delayed", "webhook"],
    "P3": ["how to", "change", "update", "question", "billing"],
}


def _get_connection():
    conn = sqlite3.connect(str(SQLITE_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _classify_severity(subject: str, description: str) -> str:
    """Heuristic severity classification based on ticket content."""
    text = (subject + " " + description).lower()
    for severity, keywords in SEVERITY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return severity
    return "P3"


def detect_security_incidents() -> list[dict]:
    """Detect P1 security incidents in open tickets."""
    conn = _get_connection()
    signals = []

    try:
        cursor = conn.execute(
            "SELECT * FROM tickets WHERE status = 'open'"
        )
        for row in cursor.fetchall():
            ticket = dict(row)
            text = (ticket["subject"] + " " + ticket["description"]).lower()

            # Check for security-related keywords
            security_keywords = ["api key", "exposure", "security", "data breach",
                                 "unauthorized", "credential", "password", "secret"]
            if any(kw in text for kw in security_keywords):
                signals.append({
                    "signal_id": f"SEC-{ticket['ticket_id']}",
                    "severity": "P1",
                    "signal_type": "security",
                    "title": f"🔴 P1 Security Incident: {ticket['subject']}",
                    "description": (
                        f"Ticket {ticket['ticket_id']} ({ticket['account_id']}) "
                        f"reports a potential security incident: {ticket['description']}. "
                        f"Per current support policy, security incidents are P1 and "
                        f"require immediate escalation."
                    ),
                    "related_tickets": [ticket["ticket_id"]],
                    "related_accounts": [ticket["account_id"]],
                    "recommended_action": (
                        "Immediate escalation required. Rotate exposed credentials, "
                        "audit access logs, and notify the security team."
                    ),
                    "detected_at": SNAPSHOT_TIMESTAMP,
                })
    finally:
        conn.close()

    return signals


def detect_patterns() -> list[dict]:
    """Detect recurring patterns across tickets and known issues."""
    conn = _get_connection()
    signals = []

    try:
        # Check for bulk upload failure pattern (TKT-502 + TKT-451 + KI-208)
        cursor = conn.execute(
            "SELECT * FROM tickets WHERE subject LIKE '%bulk%' OR subject LIKE '%upload%' "
            "OR description LIKE '%bulk%' OR description LIKE '%upload%'"
        )
        bulk_tickets = [dict(row) for row in cursor.fetchall()]

        if len(bulk_tickets) >= 2:
            ticket_ids = [t["ticket_id"] for t in bulk_tickets]
            account_ids = list(set(t["account_id"] for t in bulk_tickets))

            signals.append({
                "signal_id": "PAT-BULK-UPLOAD",
                "severity": "P2",
                "signal_type": "pattern",
                "title": "⚠️ Recurring Pattern: Bulk Upload Failures",
                "description": (
                    f"Multiple tickets report bulk upload failures: "
                    f"{', '.join(ticket_ids)}. This correlates with known issue KI-208 "
                    f"(intermittent failure above ~3,000 rows). Note: the actual plan "
                    f"limit is 5,000 rows (Growth) / 10,000 rows (Enterprise) — "
                    f"KI-208 is a bug, not a limit. Previous ticket TKT-451 incorrectly "
                    f"told LumenWorks the limit was 3,000 rows — this was wrong."
                ),
                "related_tickets": ticket_ids,
                "related_accounts": account_ids,
                "recommended_action": (
                    "Investigate KI-208 root cause. Workaround: split uploads into "
                    "batches of <3,000 rows. Correct any misinformation given to "
                    "customers about the actual upload limit."
                ),
                "detected_at": SNAPSHOT_TIMESTAMP,
            })
    finally:
        conn.close()

    return signals


def detect_sla_breaches() -> list[dict]:
    """Detect tickets at risk of or already breaching SLA."""
    conn = _get_connection()
    signals = []

    try:
        # Get open tickets with their account plans
        cursor = conn.execute("""
            SELECT t.*, a.plan
            FROM tickets t
            JOIN accounts a ON t.account_id = a.account_id
            WHERE t.status = 'open'
        """)

        for row in cursor.fetchall():
            ticket = dict(row)
            plan = ticket["plan"]
            severity = _classify_severity(
                ticket["subject"], ticket["description"]
            )

            # Get SLA target
            sla_hours = SLA_TARGETS.get(plan, {}).get(severity)
            if sla_hours is None:
                continue

            # Calculate time elapsed
            try:
                created = datetime.strptime(
                    ticket["created_at"], "%Y-%m-%d %H:%M"
                ).replace(tzinfo=IST)
                elapsed_hours = (SNAPSHOT_DT - created).total_seconds() / 3600
            except (ValueError, TypeError):
                continue

            # Check if approaching or exceeded SLA
            sla_pct = (elapsed_hours / sla_hours) * 100

            if sla_pct >= 100:
                signals.append({
                    "signal_id": f"SLA-BREACH-{ticket['ticket_id']}",
                    "severity": severity,
                    "signal_type": "sla_breach",
                    "title": f"🔴 SLA Breached: {ticket['ticket_id']}",
                    "description": (
                        f"Ticket {ticket['ticket_id']} ({ticket['account_id']}, "
                        f"{plan} plan) has been open for {elapsed_hours:.1f} hours. "
                        f"Classified as {severity} with a {sla_hours}h SLA target. "
                        f"SLA exceeded by {elapsed_hours - sla_hours:.1f} hours."
                    ),
                    "related_tickets": [ticket["ticket_id"]],
                    "related_accounts": [ticket["account_id"]],
                    "recommended_action": (
                        f"Immediate attention required. {severity} SLA for {plan} "
                        f"plan is {sla_hours} hours. Consider escalation."
                    ),
                    "detected_at": SNAPSHOT_TIMESTAMP,
                })
            elif sla_pct >= 75:
                signals.append({
                    "signal_id": f"SLA-WARN-{ticket['ticket_id']}",
                    "severity": severity,
                    "signal_type": "sla_breach",
                    "title": f"⚠️ SLA At Risk: {ticket['ticket_id']}",
                    "description": (
                        f"Ticket {ticket['ticket_id']} ({ticket['account_id']}, "
                        f"{plan} plan) is at {sla_pct:.0f}% of its {severity} SLA. "
                        f"Elapsed: {elapsed_hours:.1f}h / {sla_hours}h target."
                    ),
                    "related_tickets": [ticket["ticket_id"]],
                    "related_accounts": [ticket["account_id"]],
                    "recommended_action": (
                        f"Monitor closely. {sla_pct:.0f}% of SLA consumed. "
                        f"Prioritize resolution to avoid breach."
                    ),
                    "detected_at": SNAPSHOT_TIMESTAMP,
                })
    finally:
        conn.close()

    return signals


def get_all_signals() -> list[dict]:
    """Get all proactive detection signals, sorted by severity."""
    signals = []
    signals.extend(detect_security_incidents())
    signals.extend(detect_patterns())
    signals.extend(detect_sla_breaches())

    # Sort by severity (P1 first)
    severity_order = {"P1": 0, "P2": 1, "P3": 2, "INFO": 3}
    signals.sort(key=lambda s: severity_order.get(s["severity"], 99))

    return signals
