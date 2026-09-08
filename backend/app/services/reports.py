import json
from datetime import datetime
from typing import Any

def generate_incident_report_html(intelligence_data: dict[str, Any]) -> str:
    """
    Generate an executive, printable HTML Incident Intelligence Dossier.
    Designed for print-to-PDF with clean government-grade disaster intelligence styling.
    """
    event = intelligence_data["event"]
    spatial = intelligence_data["spatial"]
    thermal = intelligence_data["thermal"]
    temporal = intelligence_data["temporal"]
    clf = intelligence_data["classification"]
    risk = intelligence_data["risk"]
    inv = intelligence_data["investigation"]
    audit_logs = intelligence_data.get("audit_logs", [])

    evidence_items = "".join(f"<li>{ev}</li>" for ev in clf.get("supporting_evidence", []))
    uncertainty_items = "".join(f"<li>{un}</li>" for un in clf.get("uncertainty_factors", []))
    
    notes_html = ""
    for note in inv.get("notes", []):
        notes_html += f"""
        <div style="background: #f8fafc; border-left: 3px solid #3b82f6; padding: 8px 12px; margin-bottom: 8px; font-size: 13px;">
            <strong>{note.get('author', 'Analyst')}</strong> <span style="color: #64748b; font-size: 11px;">({note.get('timestamp', '')})</span>:
            <div>{note.get('text', '')}</div>
        </div>
        """

    audit_html = ""
    for log in audit_logs[:6]:
        audit_html += f"""
        <tr>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">{log.get('timestamp', '')}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600;">{log.get('action', '')}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">{log.get('user_name', '')}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">{log.get('details', '')}</td>
        </tr>
        """

    badge_color = "#dc2626" if risk["risk_level"] == "CRITICAL" else ("#ea580c" if risk["risk_level"] == "HIGH" else "#ca8a04")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Incident Intelligence Dossier - {event['event_id']}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.5;
            margin: 0;
            padding: 30px;
        }}
        .header {{
            border-bottom: 2px solid #0f172a;
            padding-bottom: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }}
        .logo-title {{
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            color: white;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
        }}
        .meta-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 25px;
        }}
        .meta-item {{
            font-size: 12px;
        }}
        .meta-label {{
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
        }}
        .meta-val {{
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
        }}
        .section-title {{
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
            margin-top: 20px;
            margin-bottom: 12px;
            color: #1e293b;
        }}
        ul {{
            margin: 0 0 15px 0;
            padding-left: 20px;
            font-size: 13px;
        }}
        li {{
            margin-bottom: 5px;
        }}
        .alert-box {{
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 4px solid #ef4444;
            padding: 12px;
            border-radius: 4px;
            font-size: 13px;
            margin-bottom: 20px;
        }}
        .signature-block {{
            margin-top: 40px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
        }}
        @media print {{
            body {{ padding: 15px; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px;">
        <button onclick="window.print()" style="background: #0f172a; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600;">Print / Save as PDF</button>
        <button onclick="window.close()" style="background: #e2e8f0; color: #0f172a; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
    </div>

    <div class="header">
        <div>
            <div class="logo-title">THERMOSCOPE AI &bull; INCIDENT INTELLIGENCE DOSSIER</div>
            <div style="font-size: 12px; color: #64748b;">National Technical Research Organisation (NTRO) &bull; Disaster Management Directorate</div>
        </div>
        <div style="text-align: right;">
            <div class="badge" style="background: {badge_color};">{risk['risk_level']} PRIORITY</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Dossier ID: DOS-{event['event_id']}</div>
        </div>
    </div>

    <div class="meta-grid">
        <div class="meta-item">
            <div class="meta-label">Event ID</div>
            <div class="meta-val">{event['event_id']}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Observation Timestamp</div>
            <div class="meta-val">{event['timestamp']}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Coordinates</div>
            <div class="meta-val">{event['latitude']:.4f}&deg;N, {event['longitude']:.4f}&deg;E</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Sensor Source</div>
            <div class="meta-val">{event['satellite']} ({event['source']})</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Assessed Classification</div>
            <div class="meta-val" style="color: {badge_color};">{clf['predicted_class']}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Assessment Confidence</div>
            <div class="meta-val">{clf['confidence_score'] * 100:.1f}%</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Nearest Facility</div>
            <div class="meta-val">{spatial.get('nearest_asset_name', 'N/A')}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Current Status</div>
            <div class="meta-val">{inv['status']}</div>
        </div>
    </div>

    <div class="alert-box">
        <strong>RESPONSIBLE AI NOTICE &amp; DISCLAIMER:</strong>
        Satellite-derived thermal observations are probabilistic radiometric signatures and do not constitute ground confirmation of an industrial fire. This assessment is intended for analyst investigation prioritisation and decision support.
    </div>

    <div class="section-title">1. Thermal Radiometric Profile &amp; Baseline Analysis</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px;">
        <tr style="background: #f8fafc;">
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Observed Fire Radiative Power (FRP):</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>{thermal.get('frp', 0):.1f} MW</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Brightness Temperature:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">{thermal.get('brightness', 0):.1f} K</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Historical Baseline Median:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">{f"{temporal['historical_median_frp']:.1f} MW" if temporal.get('historical_median_frp') else 'Insufficient history'}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Baseline Deviation:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">{f"+{temporal['deviation_percent']}%" if temporal.get('deviation_percent') is not None else 'N/A'}</td>
        </tr>
        <tr style="background: #f8fafc;">
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Temporal History Coverage:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">{temporal.get('observation_count', 0)} observations recorded</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Persistence Flag:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">{'PERSISTENT SOURCE DETECTED' if temporal.get('persistence_detected') else 'NON-PERSISTENT / TRANSIENT'}</td>
        </tr>
    </table>
    <div style="font-size: 13px; color: #475569; font-style: italic; margin-bottom: 15px;">
        Baseline Interpretation: {temporal.get('interpretation', '')}
    </div>

    <div class="section-title">2. Explainable AI Assessment &amp; Evidence Fusion</div>
    <div style="font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #166534;">Contributing Evidence Factors:</div>
    <ul>{evidence_items}</ul>

    <div style="font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #9a3412;">Known System Uncertainty Factors:</div>
    <ul>{uncertainty_items}</ul>

    <div class="section-title">3. Multi-Factor Risk Breakdown (Score: {risk['risk_score']:.1f} / 100)</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
        <tr style="background: #f1f5f9; font-weight: 700;">
            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">Component</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Component Score</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Active Weight</th>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #e2e8f0;">Thermal Intensity</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['components']['intensity']:.1f}</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['formula_weights'].get('intensity', 0.25):.2f}</td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #e2e8f0;">Industrial Proximity</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['components']['proximity']:.1f}</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['formula_weights'].get('proximity', 0.25):.2f}</td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #e2e8f0;">Baseline Abnormality</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['components']['abnormality']:.1f}</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['formula_weights'].get('abnormality', 0.20):.2f}</td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #e2e8f0;">Temporal Persistence</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['components']['persistence']:.1f}</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['formula_weights'].get('persistence', 0.15):.2f}</td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #e2e8f0;">Asset Criticality</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['components']['criticality']:.1f}</td>
            <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">{risk['formula_weights'].get('criticality', 0.10):.2f}</td>
        </tr>
    </table>

    <div class="section-title">4. Investigation Workflow &amp; Analyst Log</div>
    <div style="font-size: 13px; margin-bottom: 10px;">
        <strong>Assigned Analyst:</strong> {inv.get('assigned_analyst', 'Unassigned')} &bull;
        <strong>Recommended Action:</strong> {inv.get('recommendation', 'Review multi-source evidence.')}
    </div>
    {notes_html}

    <div class="section-title">5. Recent Audit Trail</div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
            <tr style="background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 6px; border-bottom: 1px solid #cbd5e1;">Timestamp</th>
                <th style="padding: 6px; border-bottom: 1px solid #cbd5e1;">Action</th>
                <th style="padding: 6px; border-bottom: 1px solid #cbd5e1;">User</th>
                <th style="padding: 6px; border-bottom: 1px solid #cbd5e1;">Details</th>
            </tr>
        </thead>
        <tbody>
            {audit_html}
        </tbody>
    </table>

    <div class="signature-block">
        <div>
            <div><strong>Prepared By:</strong> ThermoScope AI Automated Intelligence Engine</div>
            <div style="color: #64748b;">Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</div>
        </div>
        <div style="text-align: right;">
            <div><strong>Analyst Sign-Off:</strong> ___________________________</div>
            <div style="color: #64748b;">Date &amp; Official Designation</div>
        </div>
    </div>
</body>
</html>
"""
    return html_content
