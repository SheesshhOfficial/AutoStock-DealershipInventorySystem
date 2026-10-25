"""Explicit local setup; never creates a default shared admin password."""
import argparse
from getpass import getpass
from sqlalchemy import func, select
from app.config import Settings
from app.database import Base, make_database
from app.models import User, Vehicle
from app.schemas import Credentials
from app.security import hash_password

SAMPLES = [
    ("Toyota", "Corolla", "Sedan", 180000000, 4),
    ("Honda", "City", "Sedan", 125000000, 6),
    ("Hyundai", "Creta", "SUV", 175000000, 3),
    ("Tata", "Nexon EV", "Electric", 160000000, 2),
    ("Maruti Suzuki", "Swift", "Hatchback", 80000000, 8),
    ("Mahindra", "Thar", "SUV", 190000000, 0),
]


def seed_database(session, email, password):
    credentials = Credentials(email=email, password=password)
    if session.scalar(select(User).where(User.email == credentials.email)):
        raise ValueError("This account already exists; no data or password was changed")
    session.add(User(email=credentials.email, password_hash=hash_password(password), role="admin"))
    if session.scalar(select(func.count()).select_from(Vehicle)) == 0:
        for make, model, category, price, quantity in SAMPLES:
            session.add(Vehicle(make=make, model=model, category=category, price_cents=price, quantity=quantity))
    session.commit()


def main():
    parser = argparse.ArgumentParser(description="Create one local administrator and sample inventory if empty")
    parser.add_argument("--admin-email", required=True)
    args = parser.parse_args()
    password = getpass("New administrator password (10–128 characters): ")
    if password != getpass("Confirm password: "):
        raise SystemExit("Passwords do not match. Nothing changed.")
    settings = Settings()
    engine, factory = make_database(settings.database_url)
    try:
        Base.metadata.create_all(engine)
        with factory() as session:
            seed_database(session, args.admin_email, password)
    except ValueError as error:
        raise SystemExit(str(error))
    finally:
        engine.dispose()
    print("Administrator created. Sample vehicles added only if inventory was empty.")


if __name__ == "__main__":
    main()
