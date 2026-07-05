# ResQDrive IoT Simulator

Fake IoT sensor data generator for development and testing.

## Setup

```bash
cd iot/simulator

python -m venv venv

# Linux/Mac
source venv/bin/activate

# OR Windows
venv\Scripts\activate

pip install -r requirements.txt
```

## Run

```bash
python simulator.py
```

Server starts at:

```text
http://localhost:9000
```

## Endpoints

| Method | Path                 | Description                                                  |
| ------ | -------------------- | ------------------------------------------------------------ |
| GET    | `/`                  | Health check                                                 |
| GET    | `/status`            | Simulator status                                             |
| GET    | `/sensors/latest`    | Latest sensor reading                                        |
| WS     | `/sensors/stream`    | Live sensor stream (10 Hz)                                   |
| POST   | `/scenarios/trigger` | Trigger a scenario (body: `{"scenario": "front_collision"}`) |
| POST   | `/scenarios/clear`   | Return to idle                                               |

## Scenarios

- **idle** — parked car
- **normal_driving** — smooth driving at 50 km/h
- **hard_brake** — sudden brake (not an accident)
- **front_collision** — 3.5g deceleration spike + speed drop
- **side_collision** — lateral 2.8g impact + 2.5 rad/s rotation
- **rollover** — extreme gyroscope + z-axis oscillation
- **fender_bender** — minor 1.2g impact

## When Real IoT Arrives

This simulator will be replaced by real **ESP32 + MPU6050 + NEO-6M GPS** sending data over BLE.

The mobile app's `IoTService` abstraction makes this swap transparent — no detection logic changes needed.
