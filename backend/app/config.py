from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ReviewForge API"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://reviewforge:reviewforge@localhost:5432/reviewforge"
    sync_database_url: str = "postgresql://reviewforge:reviewforge@localhost:5432/reviewforge"
    upload_dir: str = "uploads"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]
    embedding_dimensions: int = 384


settings = Settings()
