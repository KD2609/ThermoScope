# Machine Learning Model Training & Evaluation Guide

ThermoScope AI uses an ensemble machine learning classification pipeline to categorize satellite thermal anomalies into 6 operational classes:

1. **Industrial Fire** (Uncontrolled emergency blazes at refineries, chemical units, or tank farms)
2. **Gas Flare / Persistent Thermal Source** (Routine operational relief flaring)
3. **Wildfire / Natural Fire** (Forest fires, shrub fires, and unmanaged natural biomass burning)
4. **Agricultural Burn** (Post-harvest crop stubble burning)
5. **Mining / Industrial Thermal Activity** (Blast furnaces, open-cast coal fires, slag dumping)
6. **Other / Uncertain** (Thermal reflection, ambiguous signatures)

---

## 1. Dataset Schema (`data/training_data.csv`)

The model trains from `data/training_data.csv`. You can open and edit this CSV in any spreadsheet tool or text editor to append verified incident records:

| Column | Type | Description |
|---|---|---|
| `latitude` | Float | Observation latitude (-90 to +90) |
| `longitude` | Float | Observation longitude (-180 to +180) |
| `detection_time` | ISO-8601 | e.g. `2026-09-12T14:30:00Z` |
| `brightness_temperature` | Float | Kelvin reading (e.g. 330.0 - 500.0) |
| `frp` | Float | Fire Radiative Power in Megawatts (MW) |
| `confidence` | Float | FIRMS confidence (0 - 100) |
| `day_night` | String | 'D' (Day) or 'N' (Night) |
| `historical_fire_count` | Int | Number of observations at cluster location |
| `persistence_score` | Float | Recurrence frequency ratio (0.0 to 1.0) |
| `distance_to_industrial_site` | Float | Distance in kilometers to nearest industrial plant |
| `industrial_site_type` | String | `refinery`, `steel_plant`, `power_plant`, `petrochemical`, `chemical_facility`, or `none` |
| `distance_to_residential_area` | Float | Distance in kilometers to nearest settlement |
| `land_cover` | String | `industrial`, `urban_industrial`, `urban`, `cropland`, `forest`, `barren`, `other` |
| `fire_cluster_density` | Float | Local cluster concentration (0.0 to 1.0) |
| `target_class` | String | One of the 6 target classes listed above |

---

## 2. Retraining the Model

To execute the training pipeline, run:

```bash
python ml/train.py
```

### Execution Steps:
1. **Validation**: Checks for missing fields and imputes missing numeric values with median/standard baselines.
2. **Feature Engineering**: Calculates cyclic trigonometric hour features (`hour_sin`, `hour_cos`) and one-hot encodes categorical site types.
3. **Model Fitting**: Trains a `RandomForestClassifier` with balanced class weights.
4. **Evaluation**: Evaluates accuracy, macro F1, weighted F1, per-class precision/recall, and builds a confusion matrix.
5. **Artifact Export**:
   - Serialized model bundle: `ml/models/fire_classifier_v1.pkl`
   - Evaluation metrics: `ml/models/metrics.json`

---

## 3. Inspecting Metrics

View `ml/models/metrics.json` to inspect:
- Macro & Weighted F1 scores
- Confusion matrix
- Decisive feature rankings
- Class-wise precision & recall breakdown

Real-time backend inference automatically loads `ml/models/fire_classifier_v1.pkl` via `ml/predict.py`.
