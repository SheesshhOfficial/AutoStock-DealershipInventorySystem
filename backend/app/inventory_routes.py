from fastapi import APIRouter, Depends
from app.dependencies import admin_user, current_user, get_session
from app.inventory_service import change_stock
from app.schemas import RestockInput, VehicleResponse, VehicleId

router = APIRouter(prefix="/api/vehicles", tags=["Inventory"], dependencies=[Depends(current_user)])


@router.post("/{vehicle_id}/purchase", response_model=VehicleResponse)
def purchase(vehicle_id: VehicleId, session=Depends(get_session)):
    return change_stock(session, vehicle_id, -1)


@router.post("/{vehicle_id}/restock", response_model=VehicleResponse, dependencies=[Depends(admin_user)])
def restock(vehicle_id: VehicleId, data: RestockInput, session=Depends(get_session)):
    return change_stock(session, vehicle_id, data.quantity)
