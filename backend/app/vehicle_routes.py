from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, update
from app.dependencies import admin_user, current_user, get_session
from app.models import Vehicle
from app.schemas import VehicleInput, VehicleResponse, VehicleId

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"], dependencies=[Depends(current_user)])
Price = Annotated[Decimal | None, Query(ge=0, max_digits=12, decimal_places=2, allow_inf_nan=False)]


def find_vehicle(session, vehicle_id):
    vehicle = session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(404, "Vehicle not found")
    return vehicle


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(session=Depends(get_session)):
    return session.scalars(select(Vehicle).order_by(Vehicle.id)).all()


@router.get("/search", response_model=list[VehicleResponse])
def search_vehicles(make: str = "", model: str = "", category: str = "", min_price: Price = None, max_price: Price = None, session=Depends(get_session)):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(422, "Minimum price cannot exceed maximum price")
    query = select(Vehicle)
    for column, term in [(Vehicle.make, make), (Vehicle.model, model), (Vehicle.category, category)]:
        if term.strip():
            query = query.where(column.icontains(term.strip(), autoescape=True))
    if min_price is not None:
        query = query.where(Vehicle.price_cents >= int(min_price * 100))
    if max_price is not None:
        query = query.where(Vehicle.price_cents <= int(max_price * 100))
    return session.scalars(query.order_by(Vehicle.id)).all()


@router.post("", response_model=VehicleResponse, status_code=201, dependencies=[Depends(admin_user)])
def create_vehicle(data: VehicleInput, session=Depends(get_session)):
    vehicle = Vehicle(**data.database_values())
    session.add(vehicle)
    session.commit()
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse, dependencies=[Depends(admin_user)])
def update_vehicle(vehicle_id: VehicleId, data: VehicleInput, session=Depends(get_session)):
    values = data.database_values()
    expected_quantity = values.pop("quantity")
    result = session.execute(update(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.quantity == expected_quantity).values(**values))
    if result.rowcount == 0:
        exists = session.get(Vehicle, vehicle_id) is not None
        session.rollback()
        if not exists:
            raise HTTPException(404, "Vehicle not found")
        raise HTTPException(409, "Stock changed. Refresh inventory before editing this vehicle.")
    session.commit()
    return session.get(Vehicle, vehicle_id)


@router.delete("/{vehicle_id}", status_code=204, dependencies=[Depends(admin_user)])
def delete_vehicle(vehicle_id: VehicleId, session=Depends(get_session)):
    vehicle = find_vehicle(session, vehicle_id)
    session.delete(vehicle)
    session.commit()
    return Response(status_code=204)
