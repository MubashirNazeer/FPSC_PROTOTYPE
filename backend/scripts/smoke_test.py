"""Quick API smoke test for FPSC MVP."""
from __future__ import annotations

import json
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000/api/v1"


def req(method: str, url: str, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None if data is None else json.dumps(data).encode()
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=30) as resp:
        return json.loads(resp.read().decode())


def main() -> None:
    tok = req("POST", f"{BASE}/auth/token/", {"username": "admin", "password": "Fpsc@2026"})
    assert tok.get("access"), "no access token"
    print("TOKEN ok")

    me = req("GET", f"{BASE}/auth/me/", token=tok["access"])
    assert me["success"] and me["data"]["username"] == "admin"
    print("ME ok")

    dash = req("GET", f"{BASE}/dashboard/", token=tok["access"])
    assert dash["success"]
    print("DASH ok", dash["data"].get("questions"))

    ads = req("GET", f"{BASE}/advertisements/published/")
    assert ads["success"]
    print("ADS ok", len(ads["data"]) if isinstance(ads["data"], list) else "paginated")

    ctok = req(
        "POST", f"{BASE}/auth/token/", {"username": "candidate1", "password": "Fpsc@2026"}
    )
    apps = req("GET", f"{BASE}/applications/", token=ctok["access"])
    assert apps["success"]
    print("APPS ok")

    sessions = req("GET", f"{BASE}/cbt/sessions/", token=ctok["access"])
    assert sessions["success"]
    print("SESSIONS ok", sessions["data"])

    news = req("GET", f"{BASE}/news/")
    assert news["success"]
    print("NEWS ok", len(news["data"]))
    print("SMOKE_OK")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as exc:
        raise SystemExit(f"Server not reachable: {exc}") from exc
