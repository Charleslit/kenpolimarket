"""add visibility and official columns to forecast_runs

Revision ID: dd14b1b08b7e
Revises: 
Create Date: 2025-10-10 23:13:42.663054

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dd14b1b08b7e'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add visibility, is_official, and published_at columns to forecast_runs
    op.add_column('forecast_runs', sa.Column('visibility', sa.String(length=20), nullable=False, server_default='draft'))
    op.add_column('forecast_runs', sa.Column('is_official', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('forecast_runs', sa.Column('published_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Drop columns in reverse order
    op.drop_column('forecast_runs', 'published_at')
    op.drop_column('forecast_runs', 'is_official')
    op.drop_column('forecast_runs', 'visibility')
