from enum import Enum
from dotenv import load_dotenv
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

    # Postgres connection
    database_url: str
    sqlalchemy_echo: bool = False
    postgres_pool_size: int = 5
    postgres_max_overflow: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()  # type: ignore
