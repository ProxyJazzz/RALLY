"""
Tests for RALLY Phase 10A secrets manager abstraction.
Verifies EnvSecretProvider, AWSSecretsManagerProvider mocking, and missing secret errors.
"""
from __future__ import annotations

import json
import pytest
from unittest.mock import MagicMock

from app.core.secrets import (
    EnvSecretProvider,
    AWSSecretsManagerProvider,
    SecretNotFoundError,
    get_secret_provider,
)


def test_env_secret_provider_success(monkeypatch):
    monkeypatch.setenv("TEST_RALLY_SECRET", "super_secret_value_123")
    provider = EnvSecretProvider()
    assert provider.get_secret("TEST_RALLY_SECRET") == "super_secret_value_123"


def test_env_secret_provider_missing():
    provider = EnvSecretProvider()
    with pytest.raises(SecretNotFoundError, match="Secret 'NON_EXISTENT_KEY' not found"):
        provider.get_secret("NON_EXISTENT_KEY")


def test_aws_secrets_manager_provider_plain_string():
    mock_boto = MagicMock()
    mock_boto.get_secret_value.return_value = {"SecretString": "my-database-password"}

    provider = AWSSecretsManagerProvider(client=mock_boto)
    val = provider.get_secret("rally/prod/db_password")
    assert val == "my-database-password"
    mock_boto.get_secret_value.assert_called_once_with(SecretId="rally/prod/db_password")


def test_aws_secrets_manager_provider_json():
    secret_payload = {"username": "admin", "password": "password456"}
    mock_boto = MagicMock()
    mock_boto.get_secret_value.return_value = {"SecretString": json.dumps(secret_payload)}

    provider = AWSSecretsManagerProvider(client=mock_boto)
    val = provider.get_secret("rally/prod/db_credentials")
    assert val == secret_payload


def test_aws_secrets_manager_provider_missing():
    from botocore.exceptions import ClientError

    mock_boto = MagicMock()
    mock_boto.get_secret_value.side_effect = ClientError(
        {"Error": {"Code": "ResourceNotFoundException", "Message": "Secret not found"}},
        "GetSecretValue",
    )

    provider = AWSSecretsManagerProvider(client=mock_boto)
    with pytest.raises(SecretNotFoundError, match="Secret 'unknown_secret' not found"):
        provider.get_secret("unknown_secret")


def test_get_secret_provider_factory(monkeypatch):
    monkeypatch.setenv("SECRETS_BACKEND", "env")
    p1 = get_secret_provider()
    assert isinstance(p1, EnvSecretProvider)
