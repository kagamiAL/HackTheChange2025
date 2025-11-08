from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from enum import Enum

load_dotenv()


class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class Config(BaseSettings):
    # Environment
    environment: Environment = Environment.DEVELOPMENT
    app_name: str = "Voluntr API Backend"

    # AWS DynamoDB
    aws_region: str
    dynamodb_endpoint_url: str

    # DynamoDB Table Names
    users_table_name: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


config = Config()  # type: ignore
