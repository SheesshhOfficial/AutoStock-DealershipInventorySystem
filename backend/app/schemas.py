from decimal import Decimal
from typing import Annotated
from fastapi import Path
from pydantic import BaseModel, ConfigDict, EmailStr, Field, StrictInt, field_serializer, field_validator


class Credentials(BaseModel):
    model_config = ConfigDict(extra="forbid", hide_input_in_errors=True)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        return str(value).lower()


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class VehicleInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    make: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=80)
    category: str = Field(min_length=1, max_length=40)
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    quantity: StrictInt = Field(ge=0, le=1000000)

    def database_values(self):
        return {"make": self.make, "model": self.model, "category": self.category, "price_cents": int(self.price * 100), "quantity": self.quantity}


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    make: str
    model: str
    category: str
    price: Decimal
    quantity: int

    @field_serializer("price")
    def serialize_price(self, value):
        return f"{value:.2f}"


class RestockInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    quantity: StrictInt = Field(gt=0, le=1000000)


VehicleId = Annotated[int, Path(ge=1, le=9223372036854775807)]
