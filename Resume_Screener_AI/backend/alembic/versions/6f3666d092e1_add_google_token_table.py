"""add_google_token_table

Revision ID: 6f3666d092e1
Revises: 8d29a9c893e8
Create Date: 2026-07-31 02:30:06.112217

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6f3666d092e1'
down_revision: Union[str, Sequence[str], None] = '8d29a9c893e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('google_tokens',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('company_id', sa.String(length=36), nullable=False),
        sa.Column('access_token', sa.Text(), nullable=False),
        sa.Column('refresh_token', sa.Text(), nullable=False),
        sa.Column('token_uri', sa.String(length=255), nullable=False),
        sa.Column('client_id', sa.String(length=255), nullable=False),
        sa.Column('client_secret', sa.String(length=255), nullable=False),
        sa.Column('scopes', sa.Text(), nullable=False),
        sa.Column('expiry', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id'),
    )


def downgrade() -> None:
    op.drop_table('google_tokens')
