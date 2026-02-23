from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = (
        "postgresql://campusturf:campusturf1234@localhost:5432/campusturf_db"
    )
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174"]

    # Domain format: "domain:University,domain2:University2"
    ALLOWED_UNIVERSITY_DOMAINS: str = (
        "snu.ac.kr:서울대학교,yonsei.ac.kr:연세대학교,korea.ac.kr:고려대학교", "sogang.ac.kr:서강대학교"
    )
    EMAIL_CODE_TTL_SECONDS: int = 300
    EMAIL_VERIFIED_TTL_SECONDS: int = 600

    # Local development defaults to no real SMTP delivery.
    EMAIL_VERIFICATION_DEV_MODE: bool = True
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USE_TLS: bool = True
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_SENDER: str | None = None

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
