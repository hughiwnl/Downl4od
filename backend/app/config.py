"""
App configuration loaded from environment variables (or .env file).
Uses pydantic-settings so values can be overridden via env vars in Docker.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    REDIS_URL: str = "redis://redis:6379/0"          # Redis connection for Celery broker + job state
    DOWNLOADS_DIR: str = "/app/downloads"             # Where yt-dlp saves downloaded video files
    MAX_CONCURRENT_DOWNLOADS: int = 3                 # Max Celery worker concurrency
    CORS_ORIGINS: list[str] = [                       # Allowed frontend origins for CORS
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    class Config:
        env_file = ".env"


settings = Settings()
