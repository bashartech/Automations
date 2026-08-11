import asyncio
import sys
from app.database import async_session
from app.models.orm import User
from sqlalchemy import select
from app.auth_utils import hash_password


async def main():
    email = sys.argv[1] if len(sys.argv) > 1 else input("Email: ")
    password = sys.argv[2] if len(sys.argv) > 2 else input("New password: ")

    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print("USER NOT FOUND:", email)
            return
        user.password_hash = hash_password(password)
        await db.commit()
        print(f"Password reset for {email} -> bcrypt hash set")


asyncio.run(main())
