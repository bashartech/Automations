"""make candidate_scores job_id nullable

Revision ID: 8d29a9c893e8
Revises: 9f8e7d6c5b4a
Create Date: 2026-07-31 00:50:33.445663

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d29a9c893e8'
down_revision: Union[str, Sequence[str], None] = '9f8e7d6c5b4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("candidate_scores") as b:
        b.drop_constraint("candidate_scores_job_id_fkey", type_="foreignkey")
        b.drop_constraint("uq_candidate_job_score", type_="unique")
        b.alter_column("job_id", nullable=True)
        b.create_foreign_key(
            "candidate_scores_job_id_fkey",
            "jobs",
            ["job_id"],
            ["id"],
            ondelete="SET NULL",
        )
        b.create_unique_constraint(
            "uq_candidate_job_score",
            ["candidate_id", "job_id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("candidate_scores") as b:
        b.drop_constraint("uq_candidate_job_score", type_="unique")
        b.drop_constraint("candidate_scores_job_id_fkey", type_="foreignkey")
        b.alter_column("job_id", nullable=False)
        b.create_foreign_key(
            "candidate_scores_job_id_fkey",
            "jobs",
            ["job_id"],
            ["id"],
        )
        b.create_unique_constraint(
            "uq_candidate_job_score",
            ["candidate_id", "job_id"],
        )
