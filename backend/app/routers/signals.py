"""
Signals router — proactive detection endpoint.
"""

from fastapi import APIRouter

from app.models.schemas import Signal
from app.signals.proactive_detection import get_all_signals

router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("", response_model=list[Signal])
async def get_signals():
    """Get all proactive detection signals."""
    signals = get_all_signals()
    return [Signal(**s) for s in signals]
