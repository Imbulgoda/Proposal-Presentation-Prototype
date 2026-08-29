"""Idempotent Alembic helpers for dev databases that may be partially migrated."""

from __future__ import annotations

from alembic import op
from sqlalchemy import inspect


def _inspector():
    return inspect(op.get_bind())


def column_exists(table: str, column: str) -> bool:
    return column in {c["name"] for c in _inspector().get_columns(table)}


def table_exists(table: str) -> bool:
    return table in set(_inspector().get_table_names())


def index_exists(table: str, index: str) -> bool:
    return index in {i["name"] for i in _inspector().get_indexes(table)}


def foreign_key_exists(table: str, name: str) -> bool:
    return name in {fk["name"] for fk in _inspector().get_foreign_keys(table)}
