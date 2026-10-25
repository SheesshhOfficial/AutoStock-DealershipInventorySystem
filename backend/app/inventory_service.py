from fastapi import HTTPException
from sqlalchemy import update
from app.models import Vehicle


def change_stock(session, vehicle_id, amount):
    """One conditional SQL statement prevents lost updates and negative stock."""
    query = update(Vehicle).where(Vehicle.id == vehicle_id)
    if amount < 0:
        query = query.where(Vehicle.quantity >= -amount)
    else:
        query = query.where(Vehicle.quantity <= 1000000 - amount)
    result = session.execute(query.values(quantity=Vehicle.quantity + amount))
    if result.rowcount == 0:
        exists = session.get(Vehicle, vehicle_id) is not None
        session.rollback()
        if not exists:
            raise HTTPException(404, "Vehicle not found")
        message = "Vehicle is out of stock" if amount < 0 else "Restock would exceed the stock limit"
        raise HTTPException(409, message)
    session.commit()
    return session.get(Vehicle, vehicle_id)
