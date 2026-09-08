# SIH Judge Demonstration Script

**Platform:** THERMOSCOPE AI  
**Problem Statement:** NTRO SIH PS ID 26162  

---

## 5-Minute High-Impact Presentation Walkthrough

### Act 1: The Problem & What ThermoScope AI Solves (1 Minute)
1. Open the application at `http://localhost:5173`.
2. State the central problem:
   > *"NASA FIRMS detects thermal anomalies from space, but cannot tell whether a hotspot is a routine flare stack, a catastrophic refinery fire, an agricultural stubble burn, or a subsurface coal mine fire. ThermoScope AI transforms raw satellite coordinates into explainable industrial intelligence by fusing NASA FIRMS, industrial GIS perimeters, land-use context, and 30-day temporal baselines."*
3. Highlight the Top KPI Strip:
   - 10 Active Anomalies
   - 5 Industrial Probable
   - 3 High Priority Investigations
   - 4 Persistent Sources
   - Real-time Alert Triage feed on the right panel.

---

### Act 2: Demonstration of SCENARIO A — Potential Industrial Fire (1.5 Minutes)
1. In the top bar, click **"Scenario A: Industrial Fire"** (or click **"Run SIH Key Scenario"**).
2. Point out:
   - System auto-generates a new thermal anomaly inside the **Jamnagar Mega Refinery Complex**.
   - The map pans to the Jamnagar facility perimeter.
   - The system immediately evaluates:
     - Observed FRP: **188.5 MW**
     - 30-Day Historical Baseline Median: **58.0 MW**
     - Baseline Deviation: **+125.0% above normal operating envelope**
     - Nighttime observation (VIIRS-NOAA21)
     - AI Classification: **Potential Industrial Fire (91% calibrated confidence)**
     - Risk Level: **CRITICAL (Score: 88.5 / 100)**
3. Review the **Explainability Panel**:
   - Show judges the positive contributing evidence: *"Direct spatial overlap within Jamnagar Mega Refinery perimeter"*, *"Thermal intensity +125% exceeds baseline"*.
   - Show judges the transparent limitations: *"Radiometric observation only; optical ground verification required"*.
4. Demonstrate Operational Triage:
   - Change Status from `NEW` to `UNDER REVIEW`.
   - Add note: *"Dispatched local refinery safety unit to inspect crude distillation battery."*
   - Show how the note immediately saves and writes to the immutable **Audit Trail**.
5. Click **"Generate Incident Intelligence Dossier"**:
   - Show the executive, printable HTML intelligence dossier with formal signature blocks, ready for export or printing.

---

### Act 3: Demonstration of SCENARIO B — Agricultural Burn False Positive (1.5 Minutes)
1. Click **"Scenario B: Agricultural False-Positive"**.
2. **This is the critical technical differentiator:**
   > *"Many fire detection systems simply assume: 'hotspot near factory = industrial fire.' Watch what ThermoScope AI does when a fire appears near an industrial corridor in Punjab."*
3. Show the resulting intelligence:
   - Even though it is located near an industrial corridor (~2.4 km), the system identifies:
     - Open agricultural crop parcel land context.
     - FRP of 26.5 MW aligns with seasonal stubble burning.
     - Zero facility polygon overlap.
   - Classification: **Agricultural / Biomass Burn (88% confidence)**.
   - Risk Level: **LOW (Score: 24.0 / 100)**.
   - **Emergency alarm is suppressed**, preventing false industrial alerts!

---

### Act 4: Demonstration of SCENARIO C — Persistent Industrial Source (1 Minute)
1. Click **"Scenario C: Persistent Source"**.
2. Show how repeated thermal passes at the **Korba Thermal Power Station** (31 observations, median 50 MW) are recognized as:
   - **Routine / Persistent Industrial Thermal Source**.
   - Deviation: **-1.0%** (within normal variance).
   - System categorizes it as persistent routine heat and does NOT trigger a catastrophic fire alarm.
3. Conclude by demonstrating:
   - **Asset Registry** (`Jamnagar`, `Hazira`, `Angul`, `Korba`, `Jharia`).
   - **Analytics Page** (Regional clusters, industrial vs natural ratio, Top 10 assets by risk).
   - **System Health Page** (showing dual LIVE and DEMO mode switchability).
