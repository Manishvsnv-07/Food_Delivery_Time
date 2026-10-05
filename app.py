from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import os
from dotenv import load_dotenv
import pandas as pd

load_dotenv()
app = FastAPI()
FRONTEND_URL = os.getenv("FRONTEND_URL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"]
)

class DATARequest(BaseModel):
    distance_km: float
    weather: str
    traffic_level: str
    time_of_day: str
    vehicle_type: str
    prep_time_min: int
    courier_experience_years: int

model = joblib.load("final_model.pkl")

@app.post("/api/predict")
def Predict_Time(data: DATARequest):

    input_data = pd.DataFrame([{
        "Distance_km": data.distance_km,
        "Weather": data.weather.title(),
        "Traffic_Level": data.traffic_level.title(),
        "Time_of_Day": data.time_of_day.title(),
        "Vehicle_Type": data.vehicle_type.title(),
        "Preparation_Time_min": data.prep_time_min,
        "Courier_Experience_yrs": data.courier_experience_years
    }])

    model_predict = model.predict(input_data)[0]

    print("model input:")
    print(input_data)

    print("model prediction:", model_predict)

    if model_predict == 1:
        return {"prediction": "On Time"}
    else:
        return {"prediction": "Late"}