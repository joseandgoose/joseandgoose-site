#!/usr/bin/env python3
"""
grade-ask-goose.py — Grade Ask Goose chatbot responses using local Ollama LLM.

Fetches the 10 oldest ungraded chat sessions from Supabase, sends each
conversation to Ollama (qwen3:14b) for evaluation, stores grades in
chat_grades table, marks sessions as graded, and emails a report.

Usage:
  python3 grade-ask-goose.py           # grade next 10 ungraded sessions
  python3 grade-ask-goose.py --dry-run # print report without saving to DB
  python3 grade-ask-goose.py --check   # just print count of ungraded sessions

Designed to run on the Alienware server via cron or manually.
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────

SUPABASE_URL = ""
SUPABASE_SERVICE_KEY = ""
RESEND_API_KEY = ""
NOTIFICATION_EMAIL = "odagledesoj@gmail.com"
OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen2.5:1.5b"
BATCH_SIZE = 10

# Try multiple env file locations (Alienware vs local Mac)
ENV_CANDIDATES = [
    os.path.expanduser("~/.garmin-recap/.env.local"),                              # Alienware
    os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local"),         # site repo
    os.path.expanduser("~/Desktop/joseandgoose-site-main/.env.local"),             # Mac fallback
]

ENV_KEYS = {
    "SUPABASE_URL=": "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL=": "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY=": "SUPABASE_SERVICE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY=": "SUPABASE_SERVICE_KEY",
    "RESEND_API_KEY=": "RESEND_API_KEY",
    "NOTIFICATION_EMAIL=": "NOTIFICATION_EMAIL",
}

for env_file in ENV_CANDIDATES:
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                for prefix, var in ENV_KEYS.items():
                    if line.startswith(prefix):
                        val = line.split("=", 1)[1].strip()
                        if val and not locals().get(var):
                            locals()[var] = val
                            if var == "SUPABASE_URL":
                                SUPABASE_URL = val
                            elif var == "SUPABASE_SERVICE_KEY":
                                SUPABASE_SERVICE_KEY = val
                            elif var == "RESEND_API_KEY":
                                RESEND_API_KEY = val
                            elif var == "NOTIFICATION_EMAIL":
                                NOTIFICATION_EMAIL = val
        break  # use first env file found

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}


# ── Supabase helpers ────────────────────────────────────────────────────

def fetch_ungraded_sessions():
    """Fetch ungraded chat sessions, oldest first."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/chat_sessions"
        f"?graded=eq.false&order=created_at.asc&limit={BATCH_SIZE}",
        headers={**HEADERS, "Prefer": "return=representation"},
    )
    r.raise_for_status()
    return r.json()


def fetch_messages(session_id):
    """Fetch all messages for a session, ordered chronologically."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/chat_messages"
        f"?session_id=eq.{session_id}&order=created_at.asc",
        headers=HEADERS,
    )
    r.raise_for_status()
    return r.json()


def mark_sessions_graded(session_ids):
    """Set graded=true on a list of sessions."""
    for sid in session_ids:
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/chat_sessions?id=eq.{sid}",
            headers=HEADERS,
            json={"graded": True},
        )


def save_grade_report(session_ids, report, scores, avg_score):
    """Insert a grade report row."""
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/chat_grades",
        headers={**HEADERS, "Prefer": "return=representation"},
        json={
            "session_ids": session_ids,
            "batch_size": len(session_ids),
            "report": report,
            "scores": scores,
            "avg_score": avg_score,
            "graded_by": OLLAMA_MODEL,
        },
    )
    r.raise_for_status()
    return r.json()


# ── Ollama grading ──────────────────────────────────────────────────────

GRADING_SYSTEM = """You are a QA grader. Your ONLY job is to evaluate chatbot conversations and return a JSON report. You do NOT answer user questions. You do NOT provide information. You ONLY grade conversations.

You will receive transcripts of conversations between users and an AI chatbot called "Goose" on a personal website. Grade each conversation on these dimensions (1-5 scale):
- Accuracy: Did the bot provide correct info?
- Helpfulness: Did it answer the question or dodge it?
- Tone: Was it warm and natural?
- Brevity: Was the response concise?
- Fallback: If it didn't know, did it redirect to /contact?

Return ONLY a JSON object. No markdown. No explanation. No other text. Just JSON."""

GRADING_USER_TEMPLATE = """Grade these chatbot conversations. Return ONLY valid JSON matching this exact schema:

{{"sessions":[{{"session_id":"...","question_summary":"...","assessment":"...","accuracy":4,"helpfulness":5,"tone":4,"brevity":3,"fallback":5,"overall":4.2}}],"batch_average":4.1,"issues":["...","...","..."],"strengths":["...","...","..."],"summary":"..."}}

<conversations>
{conversations}
</conversations>

Return ONLY the JSON object. Nothing else."""


def format_conversations(sessions_with_messages):
    """Format sessions into a readable block for the LLM."""
    parts = []
    for i, (session, msgs) in enumerate(sessions_with_messages, 1):
        parts.append(f"--- Conversation {i} (session: {session['id'][:8]}) ---")
        for m in msgs:
            role = "User" if m["role"] == "user" else "Goose"
            parts.append(f"{role}: {m['content']}")
        parts.append("")
    return "\n".join(parts)


def grade_single_session(session_id_short, conversation_text):
    """Grade a single conversation via Ollama chat API with forced JSON output."""
    # Cap conversation to ~2000 chars to keep inference fast on low-end hardware
    if len(conversation_text) > 2000:
        conversation_text = conversation_text[:2000] + "\n[...truncated]"

    r = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": "You grade chatbot conversations. Return only JSON."},
                {"role": "user", "content": f"""Grade this chatbot conversation. Return JSON with: question_summary, assessment, accuracy (1-5), helpfulness (1-5), tone (1-5), brevity (1-5), fallback (1-5), overall (float avg).

{conversation_text}"""},
            ],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.1, "num_predict": 256, "num_ctx": 2048},
        },
        timeout=600,
    )
    r.raise_for_status()
    content = r.json()["message"]["content"]
    if not content or not content.strip():
        print(f"  Empty response for {session_id_short}, retrying...")
        # Retry once with smaller context
        try:
            r2 = requests.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": [
                        {"role": "user", "content": f"Grade this chatbot Q&A. Return JSON with: question_summary, assessment, accuracy (1-5), helpfulness (1-5), tone (1-5), brevity (1-5), fallback (1-5), overall (avg).\n\nConversation:\n{conversation_text[:1500]}"},
                    ],
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.1, "num_predict": 512},
                },
                timeout=120,
            )
            r2.raise_for_status()
            content = r2.json()["message"]["content"]
        except Exception:
            pass

    try:
        return json.loads(content)
    except (json.JSONDecodeError, TypeError):
        print(f"  Failed to parse grade for {session_id_short}")
        return None


def grade_all_sessions(sessions_with_messages):
    """Grade each session individually, then aggregate."""
    results = []
    for session, msgs in sessions_with_messages:
        sid = session["id"][:8]
        conv_lines = []
        for m in msgs:
            role = "User" if m["role"] == "user" else "Goose"
            conv_lines.append(f"{role}: {m['content']}")
        conv_text = "\n".join(conv_lines)

        print(f"  Grading session {sid}...")
        grade = grade_single_session(sid, conv_text)
        if grade:
            grade["session_id"] = session["id"][:8]
            results.append(grade)

    return results


def parse_grades(raw_response):
    """Parse the LLM's JSON response into structured data."""
    # Strip markdown code fences if present
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[: cleaned.rfind("```")]
    # Strip leading non-JSON (thinking tags, etc.)
    json_start = cleaned.find("{")
    if json_start > 0:
        cleaned = cleaned[json_start:]

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return None


# ── Email report ────────────────────────────────────────────────────────

def send_report_email(report_text, avg_score, batch_size):
    """Send grading report via Resend."""
    if not RESEND_API_KEY:
        print("No RESEND_API_KEY — skipping email")
        return

    subject = f"Ask Goose Report — {batch_size} sessions, avg {avg_score:.1f}/5"
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #264635;">Ask Goose — Quality Report</h2>
      <p style="color: #666; font-size: 14px;">{datetime.now().strftime('%B %d, %Y')} · {batch_size} sessions graded</p>
      <div style="background: #f9f8f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="font-size: 32px; font-weight: bold; color: #264635; margin: 0;">{avg_score:.1f}<span style="font-size: 16px; color: #666;"> / 5</span></p>
        <p style="color: #666; margin: 4px 0 0; font-size: 13px;">Batch average</p>
      </div>
      <pre style="background: #f4f4f4; padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; overflow-x: auto;">{report_text}</pre>
    </div>
    """

    r = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": "market@joseandgoose.com",
            "to": [NOTIFICATION_EMAIL],
            "subject": subject,
            "html": html,
        },
    )
    if r.status_code == 200:
        print(f"Report emailed to {NOTIFICATION_EMAIL}")
    else:
        print(f"Email failed: {r.status_code} {r.text}")


# ── Main ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Grade Ask Goose chatbot sessions")
    parser.add_argument("--dry-run", action="store_true", help="Print report without saving")
    parser.add_argument("--check", action="store_true", help="Just show ungraded count")
    args = parser.parse_args()

    # Check ungraded count
    sessions = fetch_ungraded_sessions()

    if args.check:
        print(f"{len(sessions)} ungraded session(s) found (batch triggers at {BATCH_SIZE})")
        return

    if len(sessions) < BATCH_SIZE:
        print(f"Only {len(sessions)} ungraded sessions — need {BATCH_SIZE} to trigger grading.")
        return

    print(f"Grading {len(sessions)} sessions...")

    # Fetch messages for each session
    sessions_with_messages = []
    for s in sessions:
        msgs = fetch_messages(s["id"])
        if msgs:  # skip empty sessions
            sessions_with_messages.append((s, msgs))

    if not sessions_with_messages:
        print("No sessions with messages found.")
        return

    # Grade each session individually
    session_grades = grade_all_sessions(sessions_with_messages)

    if not session_grades:
        print("No sessions could be graded.")
        return

    session_ids = [s["id"] for s, _ in sessions_with_messages]

    # Calculate batch average
    scores = [g.get("overall", 0) for g in session_grades if g.get("overall")]
    avg_score = sum(scores) / len(scores) if scores else 0

    # Build readable report
    report_lines = []
    report_lines.append(f"Batch Average: {avg_score:.1f}/5\n")

    for sg in session_grades:
        report_lines.append(f"  Q: {sg.get('question_summary', 'N/A')}")
        report_lines.append(f"  Assessment: {sg.get('assessment', 'N/A')}")
        report_lines.append(
            f"  Scores — Accuracy: {sg.get('accuracy')}, "
            f"Helpful: {sg.get('helpfulness')}, "
            f"Tone: {sg.get('tone')}, "
            f"Brevity: {sg.get('brevity')}, "
            f"Fallback: {sg.get('fallback')} "
            f"-> {sg.get('overall', 'N/A')}/5"
        )
        report_lines.append("")

    report_text = "\n".join(report_lines)
    grades = {"sessions": session_grades, "batch_average": avg_score}

    print("\n" + report_text)

    if args.dry_run:
        print("\n(Dry run — nothing saved)")
        return

    # Save to Supabase
    save_grade_report(session_ids, report_text, grades, avg_score)
    mark_sessions_graded(session_ids)
    print(f"\nGrades saved. {len(session_ids)} sessions marked as graded.")

    # Email report
    send_report_email(report_text, avg_score, len(session_ids))


if __name__ == "__main__":
    main()
