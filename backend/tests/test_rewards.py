from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base
from app.models import RewardsCatalogue, UserBalance
import pytest
from datetime import datetime, timezone

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed initial test data
    db.add(UserBalance(user_id="USER001", coins=500, updated_at=datetime.now(timezone.utc)))
    db.add(RewardsCatalogue(id=1, name="Test Reward", coins_required=200, is_active=True))
    db.add(RewardsCatalogue(id=2, name="Expensive Reward", coins_required=1000, is_active=True))
    db.commit()
    
    yield
    
    # Teardown
    Base.metadata.drop_all(bind=engine)

def test_redeem_reward_success():
    response = client.post("/api/rewards/redeem", json={"reward_id": 1})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["coins_spent"] == 200
    assert data["remaining_balance"] == 300

def test_redeem_reward_insufficient_balance():
    response = client.post("/api/rewards/redeem", json={"reward_id": 2})
    assert response.status_code == 400
    assert response.json()["detail"]["error_code"] == "INSUFFICIENT_BALANCE"

def test_redeem_reward_not_found():
    response = client.post("/api/rewards/redeem", json={"reward_id": 999})
    assert response.status_code == 404
    assert response.json()["detail"]["error_code"] == "REWARD_NOT_FOUND"
