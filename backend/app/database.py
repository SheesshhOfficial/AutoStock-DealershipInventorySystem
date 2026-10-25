from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def make_database(url):
    # Hosted providers often supply postgres:// or postgresql:// URLs.
    # Select the psycopg 3 driver explicitly for both forms.
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    options = {"check_same_thread": False, "timeout": 15} if url.startswith("sqlite") else {}
    engine = create_engine(url, connect_args=options, pool_pre_ping=True)
    if url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def configure_sqlite(connection, _):
            cursor = connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    return engine, sessionmaker(bind=engine, expire_on_commit=False)
