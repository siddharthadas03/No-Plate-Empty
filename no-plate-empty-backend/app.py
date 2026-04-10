from flask import Flask, jsonify, request
from flask_cors import CORS

from ml.predict import predict_demand, predict_surplus, recommend_cooking


app = Flask(__name__)
CORS(app)

REQUIRED_FIELDS = ["day", "weekday", "meal_type", "menu", "hostel"]


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "ml-analytics"})


@app.route("/analytics", methods=["POST"])
def analytics():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON."}), 400

    missing_fields = [field for field in REQUIRED_FIELDS if field not in data]
    if missing_fields:
        return jsonify(
            {
                "error": "Missing required fields.",
                "missing_fields": missing_fields,
            }
        ), 400

    input_data = {
        "day": data["day"],
        "weekday": data["weekday"],
        "meal_type": data["meal_type"],
        "menu": data["menu"],
        "hostel": data["hostel"],
    }

    try:
        demand = predict_demand(input_data)
        cooking = recommend_cooking(demand)
        surplus = predict_surplus(input_data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception:
        return jsonify({"error": "Unable to generate analytics."}), 500

    return jsonify(
        {
            "predicted_demand": demand,
            "recommended_cooking": cooking,
            "surplus_risk": surplus,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
