import pickle
from pathlib import Path

import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeClassifier

try:
    from .utils import FEATURE_COLUMNS, preprocess_training_data, save_metadata
except ImportError:
    from utils import FEATURE_COLUMNS, preprocess_training_data, save_metadata


ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR.parent / "data" / "meal_data.csv"
DEMAND_MODEL_PATH = ML_DIR / "demand_model.pkl"
SURPLUS_MODEL_PATH = ML_DIR / "surplus_model.pkl"
METADATA_PATH = ML_DIR / "model_metadata.json"


def train_models():
    df = pd.read_csv(DATA_PATH)
    processed_df, category_mappings = preprocess_training_data(df)

    X = processed_df[FEATURE_COLUMNS]
    y = processed_df["attendance"]

    demand_model = LinearRegression()
    demand_model.fit(X, y)

    processed_df["surplus_label"] = processed_df["leftover_qty"].apply(
        lambda value: 0 if value < 10 else (1 if value < 30 else 2),
    )
    y2 = processed_df["surplus_label"]

    surplus_model = DecisionTreeClassifier(random_state=42)
    surplus_model.fit(X, y2)

    with DEMAND_MODEL_PATH.open("wb") as demand_model_file:
        pickle.dump(demand_model, demand_model_file)

    with SURPLUS_MODEL_PATH.open("wb") as surplus_model_file:
        pickle.dump(surplus_model, surplus_model_file)

    save_metadata(
        METADATA_PATH,
        {
            "feature_columns": FEATURE_COLUMNS,
            "category_mappings": category_mappings,
            "surplus_labels": ["Low", "Medium", "High"],
        },
    )

    print("Models and metadata trained and saved.")


if __name__ == "__main__":
    train_models()
