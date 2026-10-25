"""ASGI entrypoint used by Vercel's FastAPI service."""

from app.main import create_app

app = create_app()
