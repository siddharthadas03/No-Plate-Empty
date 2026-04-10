from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


FEATURE_COLUMNS = ["day", "weekday", "meal_type", "menu", "hostel"]
CATEGORICAL_COLUMNS = ["meal_type", "menu", "hostel"]


def _normalize_text(value):
    if value is None:
        return None
    return str(value).strip()


def build_category_mappings(df):
    mappings = {}
    for column in CATEGORICAL_COLUMNS:
        categories = sorted({_normalize_text(value) for value in df[column].dropna()})
        mappings[column] = {category: index for index, category in enumerate(categories)}
    return mappings


def preprocess_training_data(df, category_mappings=None):
    processed_df = df.copy()
    processed_df["date"] = pd.to_datetime(processed_df["date"])
    processed_df["day"] = processed_df["date"].dt.day
    processed_df["weekday"] = processed_df["date"].dt.weekday

    mappings = category_mappings or build_category_mappings(processed_df)

    for column in CATEGORICAL_COLUMNS:
        processed_df[column] = processed_df[column].map(
            lambda value: mappings[column].get(_normalize_text(value)),
        )

    if processed_df[CATEGORICAL_COLUMNS].isnull().any().any():
        missing_columns = processed_df[CATEGORICAL_COLUMNS].columns[
            processed_df[CATEGORICAL_COLUMNS].isnull().any()
        ]
        raise ValueError(
            f"Unable to encode categorical training data for columns: {', '.join(missing_columns)}",
        )

    return processed_df, mappings


def _encode_feature_value(column, value, category_mappings):
    if isinstance(value, str):
        normalized = _normalize_text(value)
        if column in category_mappings:
            if normalized not in category_mappings[column]:
                available = ", ".join(sorted(category_mappings[column].keys()))
                raise ValueError(
                    f"Unknown {column} value '{value}'. Expected one of: {available}",
                )
            return category_mappings[column][normalized]

        if normalized.isdigit():
            return int(normalized)

        raise ValueError(
            f"Received string value for {column}, but no category mapping is available.",
        )

    if value is None:
        raise ValueError(f"Missing required feature: {column}")

    return int(value)


def build_inference_frame(input_data, category_mappings=None):
    category_mappings = category_mappings or {}
    row = {}

    for column in FEATURE_COLUMNS:
        if column not in input_data:
            raise ValueError(f"Missing required feature: {column}")
        row[column] = _encode_feature_value(column, input_data[column], category_mappings)

    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def save_metadata(metadata_path, payload):
    metadata_path = Path(metadata_path)
    metadata_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def load_metadata(metadata_path):
    metadata_path = Path(metadata_path)
    if not metadata_path.exists():
        return None
    return json.loads(metadata_path.read_text(encoding="utf-8"))


def preprocess(df):
    processed_df, _ = preprocess_training_data(df)
    return processed_df
