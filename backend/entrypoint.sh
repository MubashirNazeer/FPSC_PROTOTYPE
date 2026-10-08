#!/bin/sh
set -e

echo "Waiting for database..."
python - <<'PY'
import os, time, sys
import urllib.parse as urlparse

url = urlparse.urlparse(os.environ.get("DATABASE_URL", ""))
if not url.hostname:
    sys.exit(0)

import psycopg2
for i in range(60):
    try:
        psycopg2.connect(
            dbname=url.path[1:],
            user=url.username,
            password=url.password,
            host=url.hostname,
            port=url.port or 5432,
        ).close()
        print("Database is ready.")
        break
    except Exception as exc:
        print(f"DB not ready ({i+1}/60): {exc}")
        time.sleep(2)
else:
    raise SystemExit("Database never became ready")
PY

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ "${RUN_SEED:-1}" = "1" ]; then
  python manage.py seed_demo || true
  python manage.py enrich_demo_content || true
fi

exec "$@"
