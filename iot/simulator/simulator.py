import asyncio
import math
import random
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="ResQDrive IoT Simulator", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCENARIOS = {
    "idle": {"label": "Idle (parked)", "duration": 0},
    "normal_driving": {"label": "Normal Driving", "duration": 30},
    "hard_brake": {"label": "Hard Brake (no accident)", "duration": 5},
    "front_collision": {"label": "Front Collision", "duration": 3},
    "side_collision": {"label": "Side Collision", "duration": 3},
    "rollover": {"label": "Rollover", "duration": 4},
    "fender_bender": {"label": "Fender Bender (minor)", "duration": 3},
}

BASE_LAT = 33.6844
BASE_LNG = 73.0479
BASE_SPEED_KMH = 50.0


class SimulatorState:
    def __init__(self):
        self.scenario: str = "idle"
        self.scenario_started_at: float = 0
        self.scenario_duration: float = 0
        self.is_running: bool = True
        self.connected_clients: list[WebSocket] = []

    def trigger_scenario(self, name: str) -> bool:
        if name not in SCENARIOS:
            return False
        self.scenario = name
        self.scenario_started_at = time.time()
        self.scenario_duration = SCENARIOS[name]["duration"]
        return True

    def clear_scenario(self):
        self.scenario = "idle"
        self.scenario_duration = 0


state = SimulatorState()


def generate_reading() -> dict:
    now = time.time()
    elapsed = now - state.scenario_started_at
    scenario = state.scenario

    accel = {"x": 0.0, "y": 0.0, "z": 1.0}
    gyro = {"x": 0.0, "y": 0.0, "z": 0.0}
    gps = {
        "lat": BASE_LAT,
        "lng": BASE_LNG,
        "speed_kmh": 0.0,
        "accuracy": 5.0,
        "heading": 0.0,
    }

    noise = lambda mag: random.uniform(-mag, mag)

    if scenario == "idle":
        accel = {"x": noise(0.02), "y": noise(0.02), "z": 1.0 + noise(0.02)}
        gyro = {"x": noise(0.01), "y": noise(0.01), "z": noise(0.01)}
        gps["speed_kmh"] = 0.0

    elif scenario == "normal_driving":
        accel = {"x": noise(0.05), "y": 0.0, "z": 1.0 + noise(0.05)}
        gyro = {"x": noise(0.02), "y": noise(0.02), "z": noise(0.03)}
        gps["speed_kmh"] = BASE_SPEED_KMH + noise(3)
        gps["heading"] = (elapsed * 5) % 360
        gps["lat"] = BASE_LAT + math.sin(elapsed * 0.01) * 0.001
        gps["lng"] = BASE_LNG + math.cos(elapsed * 0.01) * 0.001

    elif scenario == "hard_brake":
        if elapsed < 1.5:
            decel = -0.8 + noise(0.05)
            accel = {"x": decel, "y": noise(0.05), "z": 1.0 + noise(0.05)}
            gyro = {"x": noise(0.05), "y": noise(0.02), "z": noise(0.02)}
            gps["speed_kmh"] = max(0, BASE_SPEED_KMH - elapsed * 30)
        else:
            accel = {"x": noise(0.02), "y": noise(0.02), "z": 1.0}
            gyro = {"x": noise(0.01), "y": noise(0.01), "z": noise(0.01)}
            gps["speed_kmh"] = 5.0

    elif scenario == "front_collision":
        if elapsed < 0.3:
            g = 3.5 + noise(0.3)
            accel = {"x": -g, "y": noise(0.1), "z": 1.0 + noise(0.1)}
            gyro = {"x": noise(0.5), "y": noise(0.3), "z": noise(0.2)}
            gps["speed_kmh"] = max(0, BASE_SPEED_KMH - elapsed * 100)
        elif elapsed < 1.0:
            g = 2.0 + noise(0.3)
            accel = {"x": -g, "y": noise(0.5), "z": 1.0 + noise(0.2)}
            gyro = {"x": noise(1.5), "y": noise(0.8), "z": noise(0.5)}
            gps["speed_kmh"] = max(0, 20 - elapsed * 30)
        else:
            accel = {"x": noise(0.3), "y": noise(0.3), "z": 1.0 + noise(0.1)}
            gyro = {"x": noise(0.3), "y": noise(0.3), "z": noise(0.3)}
            gps["speed_kmh"] = 0.0

    elif scenario == "side_collision":
        if elapsed < 0.4:
            accel = {"x": noise(0.3), "y": 2.8 + noise(0.3), "z": 1.0 + noise(0.2)}
            gyro = {"z": 2.5 + noise(0.4), "x": noise(0.3), "y": noise(0.3)}
            gps["speed_kmh"] = max(0, BASE_SPEED_KMH - elapsed * 20)
        else:
            accel = {"x": noise(0.3), "y": noise(0.3), "z": 1.0}
            gyro = {"x": noise(0.3), "y": noise(0.3), "z": noise(0.3)}
            gps["speed_kmh"] = 30.0

    elif scenario == "rollover":
        if elapsed < 1.5:
            accel = {
                "x": noise(1.0),
                "y": noise(1.0),
                "z": 1.0 + math.sin(elapsed * 6) * 2.5,
            }
            gyro = {
                "x": 4.0 + math.sin(elapsed * 8) * 2,
                "y": noise(1.5),
                "z": noise(0.5),
            }
            gps["speed_kmh"] = max(0, BASE_SPEED_KMH - elapsed * 25)
        else:
            accel = {"x": noise(0.2), "y": noise(0.2), "z": 0.5}
            gyro = {"x": noise(0.1), "y": noise(0.1), "z": noise(0.1)}
            gps["speed_kmh"] = 0.0

    elif scenario == "fender_bender":
        if elapsed < 0.2:
            g = 1.2 + noise(0.2)
            accel = {"x": -g, "y": noise(0.2), "z": 1.0}
            gyro = {"x": noise(0.3), "y": noise(0.2), "z": noise(0.2)}
            gps["speed_kmh"] = max(0, 20 - elapsed * 50)
        else:
            accel = {"x": noise(0.1), "y": noise(0.1), "z": 1.0}
            gyro = {"x": noise(0.05), "y": noise(0.05), "z": noise(0.05)}
            gps["speed_kmh"] = 0.0

    if state.scenario_duration > 0 and elapsed > state.scenario_duration:
        state.clear_scenario()

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "scenario": state.scenario,
        "elapsed_in_scenario": round(elapsed, 3),
        "accelerometer_g": accel,
        "gyroscope_rads": gyro,
        "gps": gps,
    }


class TriggerRequest(BaseModel):
    scenario: str


@app.get("/")
def root():
    return {"name": "ResQDrive IoT Simulator", "version": "0.1.0", "status": "running"}


@app.get("/status")
def get_status():
    return {
        "is_running": state.is_running,
        "current_scenario": state.scenario,
        "elapsed_in_scenario": round(time.time() - state.scenario_started_at, 3)
        if state.scenario != "idle"
        else 0,
        "connected_clients": len(state.connected_clients),
        "available_scenarios": SCENARIOS,
    }


@app.get("/sensors/latest")
def get_latest():
    return generate_reading()


@app.post("/scenarios/trigger")
def trigger_scenario(req: TriggerRequest):
    success = state.trigger_scenario(req.scenario)
    if not success:
        return {"ok": False, "error": f"Unknown scenario: {req.scenario}"}
    return {"ok": True, "scenario": req.scenario, "label": SCENARIOS[req.scenario]["label"]}


@app.post("/scenarios/clear")
def clear_scenario():
    state.clear_scenario()
    return {"ok": True, "scenario": "idle"}


@app.websocket("/sensors/stream")
async def stream_sensors(websocket: WebSocket):
    await websocket.accept()
    state.connected_clients.append(websocket)
    try:
        while True:
            reading = generate_reading()
            await websocket.send_json(reading)
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in state.connected_clients:
            state.connected_clients.remove(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=9000)