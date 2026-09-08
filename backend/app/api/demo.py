from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.simulator import simulator
from app.schemas.schemas import ScenarioTriggerRequest

router = APIRouter(prefix="/api/demo", tags=["Demo Simulator"])

@router.post("/scenario/start")
def trigger_scenario(req: ScenarioTriggerRequest, db: Session = Depends(get_db)):
    result = simulator.trigger_scenario(req.scenario, db)
    return result

@router.post("/scenario/reset")
def reset_scenario(db: Session = Depends(get_db)):
    result = simulator.reset(db)
    return result

@router.get("/state")
def get_simulator_state():
    return {
        "is_running": simulator.is_running,
        "active_scenario": simulator.active_scenario,
        "last_event_id": simulator.last_event_id
    }
