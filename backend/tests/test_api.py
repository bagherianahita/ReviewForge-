import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_design_and_autoreview():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create = await client.post("/api/designs", json={"name": "Test Bracket", "description": "welding mount"})
        assert create.status_code == 201
        design_id = create.json()["id"]

        review = await client.post(
            f"/api/designs/{design_id}/autoreview",
            json={"include_llm": False},
        )
        assert review.status_code == 200
        data = review.json()
        assert data["design_id"] == design_id
        assert "geometry_summary" in data
