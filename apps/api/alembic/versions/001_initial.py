"""Initial Kurox schema from SQLAlchemy metadata.

Later revisions should be generated with: alembic revision --autogenerate -m "..."
"""

from alembic import op

from app.models import Base


revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
