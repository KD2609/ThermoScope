import logging
import sys
import os
import pandas as pd
from typing import Dict, Any

from ml.inference import ThermalClassifier
from alert_service.dispatcher import PipelineOrchestrator, LogDispatcher

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(message)s")

def get_sample_detections():
    return [
        {
            "observation_id": "TEST_DET_1",
            "latitude": 21.103,
            "longitude": 72.635,
            "acq_date_time": "2026-09-23T12:30:00Z",
            "frp": 120.5,
            "confidence": 0.9,
            "distance_to_residential_area": 1.5,
            "distance_to_industrial_site": 5.0,
            "persistence_score": 0.1,
            "historical_fire_count": 0,
            "fire_cluster_density": 10.0,
            "ind_type_refinery": 0,
            "ind_type_none": 1,
            # Other fields will be defaulted in inference
        },
        {
            "observation_id": "TEST_DET_2",  # Duplicate close in space and time
            "latitude": 21.105,
            "longitude": 72.637,
            "acq_date_time": "2026-09-23T12:45:00Z",
            "frp": 110.0,
            "confidence": 0.9,
            "distance_to_residential_area": 1.4,
            "distance_to_industrial_site": 5.1,
            "persistence_score": 0.1,
            "historical_fire_count": 0,
            "fire_cluster_density": 11.0,
            "ind_type_refinery": 0,
            "ind_type_none": 1,
        }
    ]

def main():
    print("="*60)
    print("Starting ML Pipeline E2E Test")
    print("="*60)
    
    try:
        classifier = ThermalClassifier(model_version="v2")
    except Exception as e:
        print(f"Failed to load model: {e}")
        return

    orchestrator = PipelineOrchestrator(classifier=classifier, dispatchers=[LogDispatcher()])
    
    samples = get_sample_detections()
    for det in samples:
        print(f"\n--- Processing Detection: {det['observation_id']} ---")
        try:
            alert = orchestrator.process_detection(det)
            if alert:
                print(f"--> Alert Created: {alert.model_dump_json(indent=2)}")
            else:
                print("--> No Alert Created (Suppressed or Duplicated)")
        except Exception as e:
            print(f"Error processing detection: {e}")

if __name__ == "__main__":
    main()
