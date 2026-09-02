"""Add research dataset fields for visit modalities and external context."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_helpers import column_exists, table_exists

revision = "0005_dataset_research_fields"
down_revision = "0004_integration_outbox"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not column_exists("children", "study_serial_number"):
        op.add_column("children", sa.Column("study_serial_number", sa.String(length=40), nullable=True))
        op.create_index("ix_children_study_serial_number", "children", ["study_serial_number"], unique=False)

    socio_cols = {
        "maternal_age_years": sa.Column("maternal_age_years", sa.Integer(), nullable=True),
        "income_category": sa.Column("income_category", sa.String(length=40), nullable=True),
        "remarks": sa.Column("remarks", sa.Text(), nullable=True),
    }
    for name, col in socio_cols.items():
        if not column_exists("socioeconomic_records", name):
            op.add_column("socioeconomic_records", col)

    dietary_cols = {
        "exclusive_breastfeeding": sa.Column("exclusive_breastfeeding", sa.Boolean(), nullable=True),
        "dietary_diversity_category": sa.Column("dietary_diversity_category", sa.String(length=20), nullable=True),
        "triposha_received": sa.Column("triposha_received", sa.Boolean(), nullable=True),
        "remarks": sa.Column("remarks", sa.Text(), nullable=True),
    }
    for name, col in dietary_cols.items():
        if not column_exists("dietary_records", name):
            op.add_column("dietary_records", col)

    if not table_exists("visit_context_snapshots"):
        op.create_table(
            "visit_context_snapshots",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("visit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("visits.id"), nullable=False, unique=True),
            sa.Column("visit_year", sa.Integer(), nullable=False),
            sa.Column("economic_growth_rate_pct", sa.Float(), nullable=True),
            sa.Column("food_price_inflation_pct", sa.Float(), nullable=True),
            sa.Column("food_price_index", sa.Float(), nullable=True),
            sa.Column("economy_stress_level", sa.String(length=40), nullable=True),
            sa.Column("events", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("schema_version", sa.String(length=40), nullable=True),
            sa.Column("source_note", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )


def downgrade() -> None:
    if table_exists("visit_context_snapshots"):
        op.drop_table("visit_context_snapshots")
    for name in ("remarks", "triposha_received", "dietary_diversity_category", "exclusive_breastfeeding"):
        if column_exists("dietary_records", name):
            op.drop_column("dietary_records", name)
    for name in ("remarks", "income_category", "maternal_age_years"):
        if column_exists("socioeconomic_records", name):
            op.drop_column("socioeconomic_records", name)
    if column_exists("children", "study_serial_number"):
        op.drop_index("ix_children_study_serial_number", table_name="children")
        op.drop_column("children", "study_serial_number")
