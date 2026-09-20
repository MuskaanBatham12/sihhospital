import base64
import cv2
import json
import numpy as np
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from pose_detection import PoseDetector
from exercises import get_exercise, list_exercises
from exercises.base import BaseExercise


app = FastAPI(
    title="VAIDYA AI — Physiotherapy & Motion Analysis API",
    version="2.0.0",
    description="Intelligent AI Physiotherapy Pose Detection & Joint Angle Analysis Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global singleton pose detector and active session trackers
try:
    pose_detector = PoseDetector()
except Exception as e:
    print(f"Warning: Could not initialize MediaPipe Pose Landmarker: {e}")
    pose_detector = None

# Active session instances per session_id
active_sessions: Dict[str, BaseExercise] = {}


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0
    visibility: Optional[float] = 1.0


class AnalyzeRequest(BaseModel):
    exercise_name: str = "squats"
    landmarks: Optional[List[LandmarkPoint]] = None
    frame_base64: Optional[str] = None
    target_reps: Optional[int] = 10
    session_id: Optional[str] = "default"


class SessionStartRequest(BaseModel):
    exercise_name: str
    target_reps: Optional[int] = 10
    patient_id: Optional[int] = None


class SessionEndRequest(BaseModel):
    session_id: Optional[str] = "default"


# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "status": "running",
        "service": "VAIDYA AI Physiotherapy Engine",
        "version": "2.0.0",
        "mediapipe_ready": pose_detector is not None
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "mediapipe_loaded": pose_detector is not None,
        "active_sessions": len(active_sessions)
    }


@app.get("/physio/status")
def physio_status():
    return {
        "status": "ready",
        "service": "Vaidya AI Physiotherapy",
        "mediapipe_tasks_active": True,
        "exercises": [ex["id"] for ex in list_exercises()],
        "total_exercises": len(list_exercises())
    }


@app.get("/physio/exercises")
def get_all_exercises():
    """Returns list of all 12 supported AI physiotherapy exercises with full metadata."""
    return {
        "count": len(list_exercises()),
        "exercises": list_exercises()
    }


@app.get("/physio/exercises/{exercise_name}")
def get_exercise_details(exercise_name: str):
    clean = exercise_name.lower().replace(" ", "_").replace("-", "_")
    for ex in list_exercises():
        if ex["id"] == clean or ex["name"].lower() == clean:
            return ex
    raise HTTPException(status_code=404, detail=f"Exercise '{exercise_name}' not found")


@app.post("/physio/session/start")
def start_physio_session(req: SessionStartRequest):
    """Initializes a new tracking session for an exercise."""
    session_id = f"session_{req.exercise_name}_{int(np.random.randint(1000, 9999))}"
    exercise = get_exercise(req.exercise_name, target_reps=req.target_reps)
    exercise.reset()
    active_sessions[session_id] = exercise

    return {
        "message": f"Session started for {exercise.name}",
        "session_id": session_id,
        "exercise": exercise.name,
        "target_reps": exercise.target_reps
    }


@app.post("/physio/analyze")
def analyze_pose(req: AnalyzeRequest):
    """
    Analyzes landmark coordinates or a base64 video frame.
    Returns joint angles, rep counters, stage, posture accuracy, and audio voice cue.
    """
    session_id = req.session_id or "default"
    
    if session_id not in active_sessions or active_sessions[session_id].name.lower() != req.exercise_name.lower():
        active_sessions[session_id] = get_exercise(req.exercise_name, target_reps=req.target_reps)

    exercise = active_sessions[session_id]
    landmarks = req.landmarks

    # If base64 frame is provided instead of pre-extracted landmarks, run MediaPipe on server
    if not landmarks and req.frame_base64 and pose_detector:
        try:
            image_data = base64.b64decode(req.frame_base64.split(",")[-1])
            np_arr = np.frombuffer(image_data, np.uint8)
            frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            landmarks = pose_detector.detect(frame_rgb)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing image frame: {e}")

    result = exercise.process(landmarks)
    return result


@app.post("/physio/session/end")
def end_physio_session(req: SessionEndRequest):
    """Concludes an exercise session and returns detailed performance analytics."""
    session_id = req.session_id or "default"
    if session_id in active_sessions:
        exercise = active_sessions.pop(session_id)
        return exercise.get_summary()
    return {
        "message": "No active session found",
        "total_reps": 0,
        "correct_reps": 0,
        "posture_score": 100
    }


# ============================================================
# WEBSOCKET REAL-TIME STREAMING
# ============================================================

@app.websocket("/physio/ws")
async def websocket_physio_endpoint(websocket: WebSocket):
    """
    Low-latency bidirectional WebSocket connection for live camera tracking.
    Client sends JSON payload with { "exercise": "squats", "landmarks": [...] }
    Server immediately replies with processed angles, reps, and voice feedback.
    """
    await websocket.accept()
    current_exercise: Optional[BaseExercise] = None

    try:
        while True:
            data_text = await websocket.receive_text()
            data = json.loads(data_text)

            exercise_name = data.get("exercise", "squats")
            if current_exercise is None or current_exercise.name.lower() != exercise_name.lower():
                current_exercise = get_exercise(exercise_name, target_reps=data.get("target_reps", 10))

            landmarks_raw = data.get("landmarks", [])
            # Convert raw landmark dicts to LandmarkPoint objects
            landmarks = [LandmarkPoint(**lm) if isinstance(lm, dict) else lm for lm in landmarks_raw]

            result = current_exercise.process(landmarks)
            await websocket.send_json(result)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)