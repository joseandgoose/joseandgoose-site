"""Print /writing/* pages ranked by total GA4 views as JSON [[path, views], ...].

Piped to Alienware's python3 over SSH by scripts/refresh-top-posts.ts; runs in
~/ga-diagnostics so ga.db is in the cwd. Kept dependency-free (stdlib only).
"""
import sqlite3, json

c = sqlite3.connect("ga.db")
rows = c.execute(
    "select page_path, sum(views) v from pages "
    "where page_path like '/writing/%' group by page_path order by v desc"
).fetchall()
print(json.dumps(rows))
