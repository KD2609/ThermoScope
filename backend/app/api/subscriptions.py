"""API endpoints for Geographic Notification Subscriptions (Public Awareness).
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.models import NotificationSubscription
from backend.app.schemas.schemas import SubscriptionCreateRequest, SubscriptionSchema

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])


@router.get("", response_model=List[SubscriptionSchema])
def list_subscriptions(
    user_email: str = Query("resident@thermoscope.local", description="Filter by user email"),
    db: Session = Depends(get_db)
):
    """List geographic awareness notification subscriptions for the user."""
    subs = db.query(NotificationSubscription).filter(NotificationSubscription.user_email == user_email).order_by(desc(NotificationSubscription.created_at)).all()
    return [s.to_dict() for s in subs]


@router.post("", response_model=SubscriptionSchema)
def create_subscription(
    payload: SubscriptionCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new geographic awareness subscription area."""
    sub = NotificationSubscription(
        user_email=payload.user_email,
        area_name=payload.area_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_km=payload.radius_km,
        email_enabled=payload.email_enabled,
        browser_enabled=payload.browser_enabled,
        sms_enabled=payload.sms_enabled
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub.to_dict()


@router.delete("/{id}")
def delete_subscription(id: int, db: Session = Depends(get_db)):
    """Delete a geographic awareness subscription."""
    sub = db.query(NotificationSubscription).filter(NotificationSubscription.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail=f"Subscription {id} not found.")

    db.delete(sub)
    db.commit()
    return {"message": f"Subscription {id} successfully deleted."}
