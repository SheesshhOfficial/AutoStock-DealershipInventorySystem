"""API behavior against a temporary, persistent SQLite database."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import create_app
from app.models import User
from app.security import hash_password


@pytest.fixture
def api(tmp_path):
    app = create_app(
        database_url=f"sqlite:///{(tmp_path / 'inventory.db').as_posix()}",
        jwt_secret="test-only-secret-with-at-least-32-characters",
    )
    with TestClient(app) as client:
        yield client, app


def login(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def admin_headers(client, app):
    with app.state.session_factory() as session:
        session.add(User(email="admin@example.com", password_hash=hash_password("admin-password"), role="admin"))
        session.commit()
    return login(client, "admin@example.com", "admin-password")


def vehicle(quantity=2):
    return {"make": "Toyota", "model": "Corolla", "category": "Sedan", "price": "15000.25", "quantity": quantity}


def test_registration_login_and_protected_access(api):
    client, app = api
    assert client.get("/api/vehicles").status_code == 401
    created = client.post("/api/auth/register", json={"email": "BUYER@EXAMPLE.COM", "password": "buyer-password"})
    assert created.status_code == 201
    assert created.json()["role"] == "customer"
    assert created.json()["email"] == "buyer@example.com"
    assert client.post("/api/auth/register", json={"email": "buyer@example.com", "password": "buyer-password"}).status_code == 409
    assert client.post("/api/auth/login", json={"email": "buyer@example.com", "password": "wrong-password"}).status_code == 401
    headers = login(client, "buyer@example.com", "buyer-password")
    assert client.get("/api/vehicles", headers=headers).status_code == 200
    assert client.post("/api/vehicles", headers=headers, json=vehicle()).status_code == 403
    assert client.post("/api/vehicles/1/restock", headers=headers, json={"quantity": 1}).status_code == 403
    assert client.delete("/api/vehicles/1", headers=headers).status_code == 403


def test_search_stock_and_admin_management(api):
    client, app = api
    headers = admin_headers(client, app)
    created = client.post("/api/vehicles", headers=headers, json=vehicle())
    assert created.status_code == 201
    vehicle_id = created.json()["id"]
    assert created.json()["price"] == "15000.25"
    assert len(client.get("/api/vehicles/search?make=toy&min_price=15000&max_price=15001", headers=headers).json()) == 1
    assert client.get("/api/vehicles/search?max_price=14999", headers=headers).json() == []
    assert client.get("/api/vehicles/search?min_price=2&max_price=1", headers=headers).status_code == 422

    url = f"/api/vehicles/{vehicle_id}"
    assert client.post(url + "/purchase", headers=headers).json()["quantity"] == 1
    assert client.post(url + "/purchase", headers=headers).json()["quantity"] == 0
    assert client.post(url + "/purchase", headers=headers).status_code == 409
    assert client.put(url, headers=headers, json=vehicle(quantity=2)).status_code == 409
    assert client.post(url + "/restock", headers=headers, json={"quantity": 3}).json()["quantity"] == 3
    assert client.put(url, headers=headers, json={**vehicle(quantity=3), "model": "Camry"}).json()["model"] == "Camry"
    assert client.delete(url, headers=headers).status_code == 204
    assert client.post(url + "/purchase", headers=headers).status_code == 404


def test_inventory_input_validation(api):
    client, app = api
    headers = admin_headers(client, app)
    for invalid in ({**vehicle(), "quantity": -1}, {**vehicle(), "price": "1.999"}, {**vehicle(), "make": " "}):
        assert client.post("/api/vehicles", headers=headers, json=invalid).status_code == 422
    created = client.post("/api/vehicles", headers=headers, json=vehicle(quantity=0))
    vehicle_id = created.json()["id"]
    assert client.post(f"/api/vehicles/{vehicle_id}/restock", headers=headers, json={"quantity": 0}).status_code == 422
    with app.state.session_factory() as session:
        assert session.scalar(select(User).where(User.email == "admin@example.com")).role == "admin"
