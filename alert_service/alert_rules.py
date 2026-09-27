from .schemas import RiskResult, RiskLevel

class AlertRulesEngine:
    """Evaluates whether a risk result warrants generating an alert."""
    
    @staticmethod
    def should_alert(risk: RiskResult) -> bool:
        """
        Configurable business logic for alert generation.
        LOW -> no alert
        MEDIUM -> no alert (could be optionally stored for monitoring)
        HIGH -> alert
        CRITICAL -> alert
        """
        if risk.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            return True
        return False
