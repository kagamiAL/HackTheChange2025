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


config = Config()
