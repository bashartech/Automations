import asyncio
from collections import defaultdict
from sqlalchemy import select, delete
from app.database import async_session
from app.models.orm import CandidateDuplicate


async def main():
    async with async_session() as db:
        result = await db.execute(select(CandidateDuplicate))
        rows = result.scalars().all()
        print(f"Total duplicate records before: {len(rows)}")

        groups: dict[tuple, list] = defaultdict(list)
        for r in rows:
            key = (min(r.candidate_id_1, r.candidate_id_2), max(r.candidate_id_1, r.candidate_id_2), r.method)
            groups[key].append(r)

        to_delete = []
        kept = 0
        for key, group in groups.items():
            group.sort(key=lambda r: r.created_at, reverse=True)
            kept += 1
            for r in group[1:]:
                to_delete.append(r.id)

        if to_delete:
            await db.execute(delete(CandidateDuplicate).where(CandidateDuplicate.id.in_(to_delete)))
            await db.commit()
            print(f"Deleted {len(to_delete)} redundant duplicate records")
        else:
            print("No redundant records to delete")

        result = await db.execute(select(CandidateDuplicate))
        rows = result.scalars().all()
        print(f"Total duplicate records after: {len(rows)}")


asyncio.run(main())
