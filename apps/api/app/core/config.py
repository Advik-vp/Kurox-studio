from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    web_origin: str = "http://localhost:5173"
    jwt_secret: str = "dev-secret"
    jwt_refresh_secret: str = "dev-refresh-secret"
    access_ttl_min: int = 15
    refresh_ttl_days: int = 30
    database_url: str = "postgresql+psycopg2://kurox:kurox@localhost:5432/kurox"
    redis_url: str = "redis://localhost:6379/0"
    email_backend: str = "console"
    storage_backend: str = "local"
    local_storage_dir: str = "./var/storage"
    s3_endpoint: str = ""
    s3_bucket: str = "kurox"
    s3_access_key: str = ""
    s3_secret_key: str = ""
    kms_key: str = "dev-only"

    @property
    def is_dev(self) -> bool:
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
