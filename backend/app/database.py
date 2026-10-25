from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def make_database(url):
    options = {"check_same_thread": False, "timeout": 15} if url.startswith("sqlite") else {}
    engine = create_engine(url, connect_args=options)
    if url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def configure_sqlite(connection, _):
            cursor = connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    return engine, sessionmaker(bind=engine, expire_on_commit=False)
