from decimal import Decimal
from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('customer', 'admin')"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="customer")


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = (CheckConstraint("price_cents >= 0"), CheckConstraint("quantity >= 0 AND quantity <= 1000000"))
    id: Mapped[int] = mapped_column(primary_key=True)
    make: Mapped[str] = mapped_column(String(80))
    model: Mapped[str] = mapped_column(String(80))
    category: Mapped[str] = mapped_column(String(40))
    price_cents: Mapped[int]
    quantity: Mapped[int]

    @property
    def price(self):
        return Decimal(self.price_cents) / 100
