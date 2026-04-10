from pathlib import Path
import sys


CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from predict import predict_demand, predict_surplus, recommend_cooking


input_data = {
    "day": 10,
    "weekday": 2,
    "meal_type": "lunch",
    "menu": "veg_pulao",
    "hostel": "A",
}

demand = predict_demand(input_data)
cooking = recommend_cooking(demand)
surplus = predict_surplus(input_data)

print("Demand:", demand)
print("Cooking:", cooking)
print("Surplus:", surplus)
