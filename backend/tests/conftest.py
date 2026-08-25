import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import Transaction, UserBalance, RewardsCatalogue

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    # Create the database and tables
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Seed basic data
    user_balance = UserBalance(user_id="USER001", coins=1000)
    reward = RewardsCatalogue(
        name="Test Reward",
        description="A test reward",
        coins_required=100,
        image_url="/test.png",
        category="Test",
        is_active=True
    )
    session.add_all([user_balance, reward])
    session.commit()
    
    yield session
    
    # Tear down after test
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]
