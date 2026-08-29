"""Add operational child registration fields."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_helpers import column_exists, foreign_key_exists, index_exists

revision = "0002_child_registration_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not column_exists("children", "full_name_encrypted"):
        op.add_column("children", sa.Column("full_name_encrypted", sa.String(length=512), nullable=True))
    if not column_exists("children", "district"):
        op.add_column("children", sa.Column("district", sa.String(length=120), nullable=True))
    if not column_exists("children", "moh_area"):
        op.add_column("children", sa.Column("moh_area", sa.String(length=120), nullable=True))
    if not column_exists("children", "phm_area"):
        op.add_column("children", sa.Column("phm_area", sa.String(length=120), nullable=True))
    if not column_exists("children", "assigned_doctor_id"):
        op.add_column("children", sa.Column("assigned_doctor_id", postgresql.UUID(as_uuid=True), nullable=True))
    if not column_exists("children", "external_patient_id_hash"):
        op.add_column("children", sa.Column("external_patient_id_hash", sa.String(length=64), nullable=True))
    if not foreign_key_exists("children", "fk_children_assigned_doctor"):
        op.create_foreign_key(
            "fk_children_assigned_doctor",
            "children",
            "users",
            ["assigned_doctor_id"],
            ["id"],
        )
    if not index_exists("children", "ix_children_facility_external_hash"):
        op.create_index(
            "ix_children_facility_external_hash",
            "children",
            ["facility_id", "external_patient_id_hash"],
            unique=True,
        )
    if not column_exists("caregivers", "reminder_consent"):
        op.add_column("caregivers", sa.Column("reminder_consent", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    if column_exists("caregivers", "reminder_consent"):
        op.drop_column("caregivers", "reminder_consent")
    if index_exists("children", "ix_children_facility_external_hash"):
        op.drop_index("ix_children_facility_external_hash", table_name="children")
    if foreign_key_exists("children", "fk_children_assigned_doctor"):
        op.drop_constraint("fk_children_assigned_doctor", "children", type_="foreignkey")
    if column_exists("children", "external_patient_id_hash"):
        op.drop_column("children", "external_patient_id_hash")
    if column_exists("children", "assigned_doctor_id"):
        op.drop_column("children", "assigned_doctor_id")
    if column_exists("children", "phm_area"):
        op.drop_column("children", "phm_area")
    if column_exists("children", "moh_area"):
        op.drop_column("children", "moh_area")
    if column_exists("children", "district"):
        op.drop_column("children", "district")
    if column_exists("children", "full_name_encrypted"):
        op.drop_column("children", "full_name_encrypted")
