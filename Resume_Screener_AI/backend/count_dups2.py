import asyncio
from sqlalchemy import select, func, or_
from app.database import async_session
from app.models.orm import CandidateProfile, CandidateDuplicate, User


async def main():
    async with async_session() as db:
        user = (await db.execute(select(User).where(User.email == "bashartc14@gmail.com"))).scalar_one()
        uid = user.id
        profiles = (await db.execute(
            select(CandidateProfile).where(CandidateProfile.user_id == uid)
        )).scalars().all()
        print(f"profiles for bashartc14: {len(profiles)}")
        pids = [p.id for p in profiles]

        # dashboard-style count
        dup_result = await db.execute(
            select(func.count(CandidateDuplicate.id))
            .join(CandidateProfile, or_(
                CandidateDuplicate.candidate_id_1 == CandidateProfile.id,
                CandidateDuplicate.candidate_id_2 == CandidateProfile.id,
            ))
            .where(CandidateProfile.user_id == uid)
            .distinct()
        )
        print(f"dashboard duplicate count: {dup_result.scalar()}")

        # count records involving these profiles directly
        involved = (await db.execute(
            select(CandidateDuplicate).where(
                or_(
                    CandidateDuplicate.candidate_id_1.in_(pids),
                    CandidateDuplicate.candidate_id_2.in_(pids),
                )
            )
        )).scalars().all()
        print(f"duplicate records involving these profiles: {len(involved)}")
        methods = {}
        for d in involved:
            methods[d.method] = methods.get(d.method, 0) + 1
        print(f"  by method: {methods}")

        # unique pairs (either order) among these profiles
        pairs = set()
        for d in involved:
            a, b = d.candidate_id_1, d.candidate_id_2
            pairs.add((min(a, b), max(a, b)))
        print(f"unique pairs: {len(pairs)}")
        for p in profiles:
            cnt = 0
            for d in involved:
                if p.id in (d.candidate_id_1, d.candidate_id_2):
                    cnt += 1
            print(f"  profile {p.name} ({p.id[:8]}): involved in {cnt} records")


asyncio.run(main())
