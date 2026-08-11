import asyncio
import sys
from app.database import async_session
from app.models.orm import User
from sqlalchemy import select
from app.auth_utils import verify_password


async def main():
    email = sys.argv[1] if len(sys.argv) > 1 else input("Email: ")
    password = sys.argv[2] if len(sys.argv) > 2 else input("Password: ")

    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == email))
        users = result.scalars().all()
        if not users:
            print("USER NOT FOUND in DB")
            return
        for u in users:
            h = u.password_hash or ''
            scheme = "bcrypt" if h.startswith("$2") and len(h) == 60 else ("sha256" if len(h) == 64 else "unknown")
            match = verify_password(password, h)
            print(f"User {u.email} (id={u.id[:8]}...)")
            print(f"  hash scheme: {scheme}  len={len(h)}  prefix={h[:7]!r}")
            print(f"  password matches: {match}")


asyncio.run(main())
