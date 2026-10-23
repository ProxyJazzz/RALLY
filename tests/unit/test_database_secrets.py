"""
RALLY — Tests for production PostgreSQL / RDS Secrets Manager integration.

Verifies:
- Parsing of Secrets Manager JSON payload matching AWS deployed schema
- database / dbname preference and fallback
- Missing / invalid database credentials handling
- AsyncPG and Psycopg2 URL construction
- SSL configuration (ssl=require / sslmode=require)
- Redaction and protection of secrets (no passwords in repr or logs)
- Local development compatibility without AWS credentials
"""
from __future__ import annotations

import json
from unittest.mock import MagicMock
import pytest

from app.core.config import Settings
from app.core.secrets import (
    DatabaseCredentials,
    resolve_database_urls,
    AWSSecretsManagerProvider,
    SecretNotFoundError,
)


VALID_SECRET_PAYLOAD = {
    "database": "rally",
    "password": "super-secure-production-password-32char",
    "dbname": "rally",
    "engine": "postgres",
    "port": 5432,
    "dbInstanceIdentifier": "rallydatabasestack-rallyrdsinstance0af2040b-fuk4pbkvvq2m",
    "host": "rallydatabasestack-rallyrdsinstance0af2040b-fuk4pbkvvq2m.cmdgs4quws8i.us-east-1.rds.amazonaws.com",
    "username": "rally_app",
}


def test_database_credentials_valid_parsing():
    creds = DatabaseCredentials.from_secret_dict(VALID_SECRET_PAYLOAD)
    assert creds.database == "rally"
    assert creds.username == "rally_app"
    assert creds.host == "rallydatabasestack-rallyrdsinstance0af2040b-fuk4pbkvvq2m.cmdgs4quws8i.us-east-1.rds.amazonaws.com"
    assert creds.port == 5432
    assert creds.password == "super-secure-production-password-32char"


def test_database_credentials_dbname_fallback():
    payload = {
        "dbname": "rally_fallback",
        "password": "pass",
        "host": "db.internal",
        "username": "user",
        "port": 5432,
    }
    creds = DatabaseCredentials.from_secret_dict(payload)
    assert creds.database == "rally_fallback"


def test_database_credentials_missing_fields():
    # Missing host
    with pytest.raises(ValueError, match="Database host is required"):
        DatabaseCredentials.from_secret_dict({
            "database": "rally",
            "username": "user",
            "password": "pwd",
        })

    # Missing username
    with pytest.raises(ValueError, match="Database username is required"):
        DatabaseCredentials.from_secret_dict({
            "database": "rally",
            "host": "localhost",
            "password": "pwd",
        })

    # Missing password
    with pytest.raises(ValueError, match="Database password is required"):
        DatabaseCredentials.from_secret_dict({
            "database": "rally",
            "host": "localhost",
            "username": "user",
        })

    # Missing database
    with pytest.raises(ValueError, match="Database name is required"):
        DatabaseCredentials.from_secret_dict({
            "host": "localhost",
            "username": "user",
            "password": "pwd",
        })

    # Non-dictionary payload
    with pytest.raises(ValueError, match="Secret payload must be a JSON dictionary"):
        DatabaseCredentials.from_secret_dict("not-a-dict")  # type: ignore[arg-type]


def test_database_credentials_invalid_port():
    payload = dict(VALID_SECRET_PAYLOAD)
    payload["port"] = "not-a-port"
    with pytest.raises(ValueError, match="Invalid database port"):
        DatabaseCredentials.from_secret_dict(payload)


def test_database_url_generation():
    creds = DatabaseCredentials.from_secret_dict(VALID_SECRET_PAYLOAD)

    async_url = creds.to_async_url(require_ssl=True)
    assert async_url.startswith("postgresql+asyncpg://")
    assert "rally_app" in async_url
    assert "super-secure-production-password-32char" in async_url
    assert "rally" in async_url

    sync_url = creds.to_sync_url(require_ssl=True)
    assert sync_url.startswith("postgresql+psycopg2://")
    assert "sslmode=require" in sync_url


def test_database_credentials_security_repr():
    creds = DatabaseCredentials.from_secret_dict(VALID_SECRET_PAYLOAD)
    repr_str = repr(creds)
    # Password must NEVER appear in object representation or string
    assert "super-secure-production-password-32char" not in repr_str
    assert "password" not in repr_str
    assert "rally_app" in repr_str
    assert "rally" in repr_str
    assert str(creds) == repr_str


def test_resolve_database_urls_with_mock_provider():
    mock_provider = MagicMock()
    mock_provider.get_secret.return_value = VALID_SECRET_PAYLOAD

    async_url, sync_url = resolve_database_urls(
        secret_id="/rally/production/database",
        provider=mock_provider,
        require_ssl=True,
    )

    mock_provider.get_secret.assert_called_once_with("/rally/production/database")
    assert async_url.startswith("postgresql+asyncpg://rally_app:")
    assert sync_url.startswith("postgresql+psycopg2://rally_app:")
    assert "sslmode=require" in sync_url


def test_settings_resolve_from_secrets_integration():
    mock_provider = MagicMock()
    mock_provider.get_secret.return_value = json.dumps(VALID_SECRET_PAYLOAD)

    settings = Settings(
        app_env="production",
        secrets_backend="aws_secrets_manager",
        database_secret_id="/rally/production/database",
    )
    # Explicitly resolve using mocked provider
    settings.resolve_database_from_secrets(provider=mock_provider)

    assert "rally_app" in settings.database_url
    assert "rallydatabasestack" in settings.database_url
    assert "sslmode=require" in settings.database_url_sync


def test_local_development_compatibility(monkeypatch):
    """Local development should keep default local credentials without touching AWS."""
    monkeypatch.delenv("SECRETS_BACKEND", raising=False)
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)

    local_settings = Settings()
    assert local_settings.secrets_backend == "env"
    assert "localhost:5432" in local_settings.database_url
    assert "postgresql+asyncpg" in local_settings.database_url
    assert "postgresql+psycopg2" in local_settings.database_url_sync
