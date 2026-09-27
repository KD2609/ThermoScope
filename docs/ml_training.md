# Machine Learning Model Training & Evaluation Guide

ThermoScope AI uses an ensemble machine learning classification pipeline to categorize satellite thermal anomalies into operational classes.

## 1. Target Classes

1. **Industrial Fire**
2. **Gas Flare / Persistent Thermal Source** 
3. **Wildfire / Natural Fire**
4. **Agricultural Burn** (To be added via CREAMS)
5. **Mining / Industrial Thermal Activity**
6. **Other / Uncertain**

*Note: Currently, ground truth labels are only verified for Gas Flare (World Bank) and Wildfire (FSI). We DO NOT fabricate labels for the other classes. The model trains only on verified labels to ensure production reliability.*

---

## 2. Data Pipeline

The pipeline uses `data/raw/firms_archive/2023/firms_2023.csv` as the raw source. 

To execute the training pipeline, run the following steps in sequence from the project root:

### Step 1: Label Matching
```bash
python data_prep/match_firm_labels.py
```
Matches FIRMS observations to independent data sources (FSI and World Bank Global Gas Flaring).
- Generates a stable deterministic `observation_id`.
- Output: `data/labels/jan2023_firms_labels.csv`

### Step 2: Historical Context Features
```bash
python ml/historical_features.py
```
Generates `historical_fire_count`, `persistence_score`, and `fire_cluster_density`. 
- **CRITICAL**: Uses a strictly prior time window (`acq_date < current_date`) to prevent future data leakage.
- Utilizes `sklearn.neighbors.BallTree` for rapid geospatial lookups.
- Output: `data/processed/historical_features.csv`

### Step 3: Base Feature Extraction
```bash
python ml/feature_extractor.py
```
Extracts numeric, daytime, and contextual distance features for all observations.
- Output: `data/processed/firms_features_2023.csv`

### Step 4: Merge Context
```bash
python ml/merge_historical_features.py
```
Merges the `historical_features.csv` into `firms_features_2023.csv` via the stable `observation_id`.

### Step 5: Build Training Dataset
```bash
python data_prep/build_training_dataset.py
```
Joins features and verified labels by `observation_id`. Drops unmatched observations to ensure the model is trained *only* on reliable ground truth.
- Output: `data/processed/training_dataset.csv`

### Step 6: Train Model
```bash
python ml/train.py
```
Trains the `RandomForestClassifier`.
- Implements an **event-aware** `GroupShuffleSplit` (grouped by rounded location + date) to prevent spatial-temporal leakage between training and testing sets.
- Output: `ml/models/fire_classifier_v1.pkl` and `ml/models/metrics.json`

---

## 3. Risk Engine (`ml/risk_engine.py`)

Classification determines *what* the anomaly is, while the **Risk Engine** determines *how dangerous* it is. 

Risk scores (0-100) are generated post-prediction by assessing:
- Predicted class and confidence
- Fire Radiative Power (FRP)
- Proximity to residential areas
- Proximity to industrial sites (e.g. Wildfire threatening a refinery)
- Persistence (A high persistence score indicates routine flaring, reducing acute risk)

---

## 4. How to add CREAMS later

To add agricultural burn labels from CREAMS:
1. Parse the CREAMS data into a format with coordinates and dates.
2. In `data_prep/match_firm_labels.py`, add a matching step to find FIRMS records within the CREAMS radius/date.
3. Assign the label "Agricultural Burn" to matching rows.
4. Rerun the pipeline! The model will seamlessly integrate the new class.

## 5. Adding more Historical FIRMS data

1. Place the new data in `data/raw/firms_archive/`.
2. Update the `HISTORICAL_FILE` path in `ml/historical_features.py`.
3. Update `RAW_FIRMS_FILE` in `ml/feature_extractor.py` and rerun the pipeline.
