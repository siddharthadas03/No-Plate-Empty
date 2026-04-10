from pathlib import Path
import pickle

try:
    from .utils import FEATURE_COLUMNS, build_inference_frame, load_metadata
except ImportError:
    from utils import FEATURE_COLUMNS, build_inference_frame, load_metadata


ML_DIR = Path(__file__).resolve().parent
DEMAND_MODEL_PATH = ML_DIR / "demand_model.pkl"
SURPLUS_MODEL_PATH = ML_DIR / "surplus_model.pkl"
METADATA_PATH = ML_DIR / "model_metadata.json"


def _load_model(model_path):
    with model_path.open("rb") as model_file:
        return pickle.load(model_file)


demand_model = _load_model(DEMAND_MODEL_PATH)
surplus_model = _load_model(SURPLUS_MODEL_PATH)
model_metadata = load_metadata(METADATA_PATH) or {}
category_mappings = model_metadata.get("category_mappings", {})
surplus_labels = model_metadata.get("surplus_labels", ["Low", "Medium", "High"])


def predict_demand(input_data):
    df = build_inference_frame(input_data, category_mappings)
    df = df[FEATURE_COLUMNS]
    prediction = demand_model.predict(df)
    return max(0, int(round(prediction[0])))


def recommend_cooking(predicted_demand):
    buffer = int(predicted_demand * 0.1)
    return predicted_demand + buffer


def predict_surplus(input_data):
    df = build_inference_frame(input_data, category_mappings)
    df = df[FEATURE_COLUMNS]
    pred = int(surplus_model.predict(df)[0])

    if pred < 0 or pred >= len(surplus_labels):
        return "Unknown"
    return surplus_labels[pred]
