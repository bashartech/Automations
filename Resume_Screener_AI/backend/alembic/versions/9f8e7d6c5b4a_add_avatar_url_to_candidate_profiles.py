"""add avatar_url to candidate_profiles

Revision ID: 9f8e7d6c5b4a
Revises: a1b2c3d4e5f6
Create Date: 2026-07-30 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f8e7d6c5b4a"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("candidate_profiles", sa.Column("avatar_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("candidate_profiles", "avatar_url")
