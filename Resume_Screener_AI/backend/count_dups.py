import asyncio
from sqlalchemy import select, func
from app.database import async_session
from app.models.orm import CandidateProfile, CandidateDuplicate, User


async def main():
    async with async_session() as db:
        users = (await db.execute(select(User.id, User.email))).all()
        for uid, uemail in users:
            cnt = (await db.execute(
                select(func.count(CandidateProfile.id)).where(CandidateProfile.user_id == uid)
            )).scalar()
            print(f"user {uemail}: profiles={cnt}")

        total_profiles = (await db.execute(select(func.count(CandidateProfile.id)))).scalar()
        print(f"TOTAL profiles: {total_profiles}")

        dups = (await db.execute(select(CandidateDuplicate))).scalars().all()
        print(f"TOTAL duplicate records: {len(dups)}")
        methods = {}
        for d in dups:
            methods[d.method] = methods.get(d.method, 0) + 1
        print(f"by method: {methods}")

        method_counts = (await db.execute(
            select(CandidateDuplicate.method, func.count())
            .group_by(CandidateDuplicate.method)
        )).all()
        print("grouped:", [(m, c) for m, c in method_counts])


asyncio.run(main())
