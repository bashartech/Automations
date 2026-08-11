"""
Helper: Generate the Google OAuth authorization URL.

Usage:
    python google_auth_url.py <email> <password> [company_id]

If company_id is omitted, the script uses your user's company_id.
"""
import asyncio
import sys
import httpx


async def main():
    email = sys.argv[1] if len(sys.argv) > 1 else input("Email: ")
    password = sys.argv[2] if len(sys.argv) > 2 else input("Password: ")

    base = "http://localhost:8002"

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{base}/api/auth/login",
            json={"email": email, "password": password},
        )
        if r.status_code != 200:
            print(f"Login failed: {r.status_code} {r.text[:200]}")
            return
        data = r.json()
        token = data.get("access_token") or data.get("token") or data.get("accessToken")
        company_id = (data.get("user") or {}).get("company_id")
        if not token:
            print("Could not find token in response:", list(data.keys()))
            return

        if len(sys.argv) > 3:
            company_id = sys.argv[3]
        if not company_id:
            print("No company_id found — pass it as arg 3: python google_auth_url.py <email> <password> <company_id>")
            return

        r2 = await client.get(
            f"{base}/api/google/auth/url",
            params={"company_id": company_id},
            headers={"Authorization": f"Bearer {token}"},
        )
        if r2.status_code != 200:
            print(f"Failed: {r2.status_code} {r2.text[:300]}")
            return
        print()
        print("=" * 70)
        print("OPEN THIS URL IN YOUR BROWSER AND CLICK ALLOW:")
        print("=" * 70)
        print(r2.json()["auth_url"])
        print("=" * 70)
        print()
        print("After allowing, you'll be redirected back to the backend")
        print("callback URL. That means authorization is complete.")
        print()


asyncio.run(main())
