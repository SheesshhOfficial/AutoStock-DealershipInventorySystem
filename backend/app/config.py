from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./autostock.db"
    jwt_secret: str = Field(min_length=32)
    frontend_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    access_token_minutes: int = 30

    @field_validator("jwt_secret")
    @classmethod
    def require_real_secret(cls, value):
        if value.startswith("replace-this"):
            raise ValueError("Generate a random JWT_SECRET before starting the API")
        return value
