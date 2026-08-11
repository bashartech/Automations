from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncEngine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()


def _clean_pg_url(url: str) -> str:
    if not url:
        return url
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    parsed = urlparse(url)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    for key in ["sslmode", "channel_binding"]:
        qs.pop(key, None)
    parsed = parsed._replace(query=urlencode(qs, doseq=True))
    return urlunparse(parsed)


engine: AsyncEngine = create_async_engine(
    _clean_pg_url(settings.neon_database_url),
    echo=False,
    poolclass=NullPool,
    connect_args={"ssl": "require"} if "neon.tech" in settings.neon_database_url else {},
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database: create tables if they don't exist.
    Run `alembic upgrade head` for full migration management."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
