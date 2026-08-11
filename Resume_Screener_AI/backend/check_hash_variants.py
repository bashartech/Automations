import hashlib
from app.database import async_session
from app.models.orm import User
from sqlalchemy import select
import asyncio

password = "B@$har028cs"
email = "bashartc14@gmail.com"


async def main():
    async with async_session() as db:
        result = await db.execute(select(User.password_hash).where(User.email == email))
        stored = result.scalar_one()
    print("stored:", stored[:20], "...")

    variants = {
        "sha256(pw)": hashlib.sha256(password.encode()).hexdigest(),
        "sha256(email+pw)": hashlib.sha256((email + password).encode()).hexdigest(),
        "sha256(pw+email)": hashlib.sha256((password + email).encode()).hexdigest(),
        "sha256(email:pw)": hashlib.sha256(f"{email}:{password}".encode()).hexdigest(),
        "md5(pw)": hashlib.md5(password.encode()).hexdigest(),
        "sha1(pw)": hashlib.sha1(password.encode()).hexdigest(),
        "sha256(pw.lower())": hashlib.sha256(password.lower().encode()).hexdigest(),
        "sha256(lower pw+lower email)": hashlib.sha256((email.lower() + password.lower()).encode()).hexdigest(),
    }
    for name, h in variants.items():
        marker = "  <<< MATCH" if h == stored else ""
        print(f"{name}: {h[:20]}{marker}")


asyncio.run(main())
