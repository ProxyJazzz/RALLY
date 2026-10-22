"""
RALLY — Production & Local Secrets Management Abstraction.

Supports:
- Local development: Environment variables / .env
- AWS Production: AWS Secrets Manager via boto3 (using ambient IAM role credentials)

Never logs or returns secret values in cleartext error representations.
"""
from __future__ import annotations

import json
import os
from typing import Any, Protocol


class SecretNotFoundError(KeyError):
    """Raised when a requested secret cannot be located."""
    pass


class SecretProvider(Protocol):
    """Protocol for fetching secrets dynamically."""

    def get_secret(self, secret_id: str) -> Any:
        """Fetch a secret string or JSON payload by identifier."""
        ...


class EnvSecretProvider:
    """Retrieves secrets from OS environment variables (local/test default)."""

    def get_secret(self, secret_id: str) -> str:
        # Check direct env var or mapped key
        val = os.environ.get(secret_id)
        if val is not None:
            return val
        # Check uppercase normalized key (e.g., db-password -> DB_PASSWORD)
        normalized = secret_id.replace("-", "_").replace(".", "_").upper()
        val = os.environ.get(normalized)
        if val is not None:
            return val
        raise SecretNotFoundError(f"Secret '{secret_id}' not found in environment.")


class AWSSecretsManagerProvider:
    """
    Retrieves secrets from AWS Secrets Manager using ambient AWS credential chain
    (IAM Role, ECS task role, or AWS profile).
    """

    def __init__(self, region_name: str | None = None, client: Any | None = None):
        self.region_name = region_name or os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
        self._custom_client = client

    def _get_client(self) -> Any:
        if self._custom_client is not None:
            return self._custom_client
        import boto3
        from botocore.config import Config

        cfg = Config(
            region_name=self.region_name,
            connect_timeout=5.0,
            read_timeout=5.0,
            retries={"max_attempts": 2, "mode": "standard"},
        )
        return boto3.client("secretsmanager", config=cfg)

    def get_secret(self, secret_id: str) -> Any:
        client = self._get_client()
        try:
            response = client.get_secret_value(SecretId=secret_id)
            if "SecretString" in response:
                content = response["SecretString"]
                try:
                    return json.loads(content)
                except (json.JSONDecodeError, TypeError):
                    return content
            raise ValueError(f"Secret '{secret_id}' does not contain SecretString payload.")
        except Exception as e:
            from botocore.exceptions import ClientError
            if isinstance(e, ClientError) and e.response.get("Error", {}).get("Code") in (
                "ResourceNotFoundException",
                "SecretsManager.Client.exceptions.ResourceNotFoundException",
            ):
                raise SecretNotFoundError(f"Secret '{secret_id}' not found in AWS Secrets Manager.") from None
            # Mask sensitive parameters from exception messages
            raise RuntimeError(f"Failed to retrieve secret '{secret_id}' from AWS Secrets Manager: {type(e).__name__}") from None



class SecretsManager:
    """Centralized secrets access point for RALLY."""

    def __init__(self, provider: SecretProvider | None = None):
        self._provider = provider or EnvSecretProvider()

    def set_provider(self, provider: SecretProvider) -> None:
        """Allows runtime swapping of provider for AWS mode or testing."""
        self._provider = provider

    def get(self, secret_id: str, default: str | None = None) -> str:
        """Retrieve a secret, returning default if absent."""
        try:
            return self._provider.get_secret(secret_id)
        except (KeyError, RuntimeError):
            if default is not None:
                return default
            raise

    def get_json(self, secret_id: str, default: dict[str, Any] | None = None) -> dict[str, Any]:
        """Retrieve and parse JSON structured secret."""
        raw = self.get(secret_id, default=None if default is None else "")
        if not raw and default is not None:
            return default
        try:
            return json.loads(raw)
        except Exception as e:
            raise ValueError(f"Secret '{secret_id}' does not contain valid JSON payload.") from e


# Global instance
secrets = SecretsManager()


def get_secret_provider() -> SecretProvider:
    """Factory creating the appropriate secret provider based on SECRETS_BACKEND env var."""
    backend = os.environ.get("SECRETS_BACKEND", "env").lower()
    if backend == "aws_secrets_manager":
        return AWSSecretsManagerProvider()
    return EnvSecretProvider()

