from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth_routes import router as auth_router
from app.vehicle_routes import router as vehicle_router
from app.inventory_routes import router as inventory_router
from app.config import Settings
from app.database import Base, make_database


def create_app(database_url=None, jwt_secret=None):
    overrides = {}
    if database_url is not None:
        overrides["database_url"] = database_url
    if jwt_secret is not None:
        overrides["jwt_secret"] = jwt_secret
    settings = Settings(**overrides)
    engine, session_factory = make_database(settings.database_url)

    @asynccontextmanager
    async def lifespan(app):
        Base.metadata.create_all(engine)
        yield
        engine.dispose()

    app = FastAPI(title="AutoStock API", version="1.0.0", lifespan=lifespan)
    app.state.settings = settings
    app.state.session_factory = session_factory
    app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in settings.frontend_origins.split(",")], allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type"])
    app.include_router(auth_router)
    app.include_router(vehicle_router)
    app.include_router(inventory_router)

    @app.get("/api/health", tags=["Health"])
    def health():
        return {"status": "ok"}

    return app
