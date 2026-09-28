CORE THEORY V10.1.5 — ZERO-SESSION TRUTH FIX

ROOT CAUSE FOUND:
The client Home card can show 0 sessions from client_packages.sessions_remaining, while older Bring-a-Friend logic was checking clients.sessions. Those two fields can disagree. That could make the UI offer "current package" even though the active package is actually exhausted, and Supabase then correctly returned "You have no sessions remaining."

FIX:
- If an active client_packages row exists, its sessions_remaining is now the source of truth.
- An exhausted active package NEVER falls back to stale clients.sessions.
- For 0 usable sessions, compatible Pay later packages are listed FIRST.
- No "Use current package" option is shown.
- Choosing a package sends its membership ID to book_class_with_event_guest, creating Payment Pending.

Requires successful V10.1.1 SQL. No new SQL.

Upload together:
1. app-v10.1.5.js
2. index.html
3. service-worker.js
