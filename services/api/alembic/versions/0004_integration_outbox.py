"""Extend integration outbox + C3 reassessment request tracking."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_helpers import column_exists, index_exists, table_exists

revision = "0004_integration_outbox"
down_revision = "0003_clinician_reviews"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not column_exists("integration_events", "contract_version"):
        op.add_column("integration_events", sa.Column("contract_version", sa.String(length=20), server_default="1.0", nullable=False))
    if not column_exists("integration_events", "correlation_id"):
        op.add_column("integration_events", sa.Column("correlation_id", postgresql.UUID(as_uuid=True), nullable=True))
    if not column_exists("integration_events", "idempotency_key"):
        op.add_column("integration_events", sa.Column("idempotency_key", sa.String(length=200), nullable=True))
    if not column_exists("integration_events", "delivery_status"):
        op.add_column(
            "integration_events",
            sa.Column("delivery_status", sa.String(length=40), server_default="PENDING", nullable=False),
        )
    if not column_exists("integration_events", "attempt_count"):
        op.add_column("integration_events", sa.Column("attempt_count", sa.Integer(), server_default="0", nullable=False))
    if not column_exists("integration_events", "next_attempt_at"):
        op.add_column("integration_events", sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True))
    if not column_exists("integration_events", "last_attempt_at"):
        op.add_column("integration_events", sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True))
    if not column_exists("integration_events", "external_ref"):
        op.add_column("integration_events", sa.Column("external_ref", sa.JSON(), nullable=True))
    if not index_exists("integration_events", "ix_integration_events_correlation_id"):
        op.create_index("ix_integration_events_correlation_id", "integration_events", ["correlation_id"])
    if not index_exists("integration_events", "ix_integration_events_idempotency_key"):
        op.create_index("ix_integration_events_idempotency_key", "integration_events", ["idempotency_key"], unique=True)
    if not index_exists("integration_events", "ix_integration_events_delivery_status"):
        op.create_index("ix_integration_events_delivery_status", "integration_events", ["delivery_status"])
    if not index_exists("integration_events", "ix_integration_events_target"):
        op.create_index("ix_integration_events_target", "integration_events", ["target"])

    op.execute(
        """
        UPDATE integration_events
        SET delivery_status = CASE
            WHEN delivered_at IS NOT NULL THEN 'DELIVERED'
            WHEN delivery_error IS NOT NULL THEN 'FAILED_RETRYABLE'
            ELSE 'PENDING'
        END
        WHERE delivery_status IS NULL OR delivery_status = 'PENDING'
        """
    )

    if not table_exists("c3_reassessment_requests"):
        op.create_table(
            "c3_reassessment_requests",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("facility_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=False),
            sa.Column("child_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("children.id"), nullable=False),
            sa.Column("visit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("visits.id"), nullable=False),
            sa.Column("prediction_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("predictions.id"), nullable=False),
            sa.Column("clinician_review_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clinician_reviews.id"), nullable=False),
            sa.Column("integration_event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("integration_events.id"), nullable=True),
            sa.Column("status", sa.String(length=40), server_default="QUEUED", nullable=False),
            sa.Column("external_request_id", sa.String(length=120), nullable=True),
            sa.Column("result_ref", sa.String(length=200), nullable=True),
            sa.Column("result_url", sa.String(length=500), nullable=True),
            sa.Column("last_error", sa.Text(), nullable=True),
            sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.UniqueConstraint("clinician_review_id", name="uq_c3_request_clinician_review"),
        )
    if not index_exists("c3_reassessment_requests", "ix_c3_reassessment_requests_child_id"):
        op.create_index("ix_c3_reassessment_requests_child_id", "c3_reassessment_requests", ["child_id"])
    if not index_exists("c3_reassessment_requests", "ix_c3_reassessment_requests_status"):
        op.create_index("ix_c3_reassessment_requests_status", "c3_reassessment_requests", ["status"])


def downgrade() -> None:
    if table_exists("c3_reassessment_requests"):
        op.drop_index("ix_c3_reassessment_requests_status", table_name="c3_reassessment_requests")
        op.drop_index("ix_c3_reassessment_requests_child_id", table_name="c3_reassessment_requests")
        op.drop_table("c3_reassessment_requests")
    if index_exists("integration_events", "ix_integration_events_target"):
        op.drop_index("ix_integration_events_target", table_name="integration_events")
    if index_exists("integration_events", "ix_integration_events_delivery_status"):
        op.drop_index("ix_integration_events_delivery_status", table_name="integration_events")
    if index_exists("integration_events", "ix_integration_events_idempotency_key"):
        op.drop_index("ix_integration_events_idempotency_key", table_name="integration_events")
    if index_exists("integration_events", "ix_integration_events_correlation_id"):
        op.drop_index("ix_integration_events_correlation_id", table_name="integration_events")
    if column_exists("integration_events", "external_ref"):
        op.drop_column("integration_events", "external_ref")
    if column_exists("integration_events", "last_attempt_at"):
        op.drop_column("integration_events", "last_attempt_at")
    if column_exists("integration_events", "next_attempt_at"):
        op.drop_column("integration_events", "next_attempt_at")
    if column_exists("integration_events", "attempt_count"):
        op.drop_column("integration_events", "attempt_count")
    if column_exists("integration_events", "delivery_status"):
        op.drop_column("integration_events", "delivery_status")
    if column_exists("integration_events", "idempotency_key"):
        op.drop_column("integration_events", "idempotency_key")
    if column_exists("integration_events", "correlation_id"):
        op.drop_column("integration_events", "correlation_id")
    if column_exists("integration_events", "contract_version"):
        op.drop_column("integration_events", "contract_version")
