from enum import Enum
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

load_dotenv()


class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class Settings(BaseSettings):
    # Environment
    environment: Environment = Environment.DEVELOPMENT
    app_name: str = "Voluntr API Backend"
    frontend_url: str | None = None
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    # Postgres connection
    database_url: str
    sqlalchemy_echo: bool = False
    postgres_pool_size: int = 5
    postgres_max_overflow: int = 10
    firebase_service_account_json: str = Field(
        ...,
        description="Raw Firebase service account JSON used to initialize firebase_admin.",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()  # type: ignore
if settings.frontend_url and settings.frontend_url not in settings.cors_allow_origins:
    settings.cors_allow_origins.append(settings.frontend_url)
