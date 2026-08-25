"""
Rewards API routes — provides endpoints for coin balance,
rewards catalogue, redemption, and redemption history.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import CoinBalanceOut, RewardOut, RedeemRequest, RedeemResponse, RedemptionHistoryOut
from app.services import reward_service

router = APIRouter(prefix="/api/rewards", tags=["Rewards"])


@router.get("/balance", response_model=CoinBalanceOut)
def get_balance(db: Session = Depends(get_db)):
    """Get current coin balance."""
    return reward_service.get_coin_balance(db)


@router.get("/catalogue", response_model=list[RewardOut])
def get_catalogue(db: Session = Depends(get_db)):
    """Get available rewards catalogue."""
    rewards = reward_service.get_rewards_catalogue(db)
    return [RewardOut.model_validate(r) for r in rewards]


@router.post("/redeem", response_model=RedeemResponse)
def redeem(request: RedeemRequest, db: Session = Depends(get_db)):
    """
    Redeem a reward using coins. Validates sufficient balance and
    reward availability. Returns proper error codes on failure.
    """
    try:
        result = reward_service.redeem_reward(db, request.reward_id)
        return RedeemResponse(**result)
    except ValueError as e:
        error_args = e.args
        if len(error_args) >= 2:
            error_code, message = error_args[0], error_args[1]
        else:
            error_code = "UNKNOWN_ERROR"
            message = str(e)

        # Map error codes to HTTP status codes
        status_map = {
            "REWARD_NOT_FOUND": 404,
            "USER_NOT_FOUND": 404,
            "INSUFFICIENT_BALANCE": 400,
            "REDEEM_FAILED": 500,
        }
        status_code = status_map.get(error_code, 400)
        raise HTTPException(
            status_code=status_code,
            detail={"message": message, "error_code": error_code},
        )


@router.get("/history", response_model=list[RedemptionHistoryOut])
def get_history(db: Session = Depends(get_db)):
    """Get redemption history."""
    return reward_service.get_redemption_history(db)
