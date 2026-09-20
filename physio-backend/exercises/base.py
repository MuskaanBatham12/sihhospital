import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from angle_utils import AngleSmoother


class BaseExercise(ABC):
    """
    Abstract Base Class for AI Physiotherapy Exercises.
    Provides standard repetition counting, state tracking, debounce/cooldown,
    accuracy calculation, and session feedback generation.
    """
    def __init__(self, name: str, target_reps: int = 10, voice_cooldown: float = 2.0):
        self.name = name
        self.target_reps = target_reps
        self.voice_cooldown = voice_cooldown

        self.reps = 0
        self.correct_reps = 0
        self.incorrect_reps = 0
        self.stage = "START"
        self.form_status = "READY"  # GOOD, ADJUST, WARNING, READY, NO_BODY
        self.feedback = "Position yourself in front of the camera"
        self.accuracy = 100
        self.joint_angle = 0.0

        self.smoother = AngleSmoother(window_size=5)
        self.last_voice_time = 0.0
        self.last_voice_message = ""
        self.mistakes_log: List[str] = []
        self.session_start_time = time.time()
        self.rep_scores: List[float] = []

    def reset(self):
        """Resets the exercise session state."""
        self.reps = 0
        self.correct_reps = 0
        self.incorrect_reps = 0
        self.stage = "START"
        self.form_status = "READY"
        self.feedback = "Starting exercise. Maintain good form."
        self.accuracy = 100
        self.joint_angle = 0.0
        self.smoother.reset()
        self.last_voice_time = 0.0
        self.last_voice_message = ""
        self.mistakes_log.clear()
        self.rep_scores.clear()
        self.session_start_time = time.time()

    def should_voice(self, message: str) -> bool:
        """Determines if a voice cue should be spoken based on debounce cooldown."""
        current_time = time.time()
        if message != self.last_voice_message or (current_time - self.last_voice_time > self.voice_cooldown):
            self.last_voice_time = current_time
            self.last_voice_message = message
            return True
        return False

    def log_mistake(self, mistake: str):
        """Logs a form mistake without flooding."""
        if mistake not in self.mistakes_log:
            self.mistakes_log.append(mistake)

    @abstractmethod
    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        """
        Process pose landmarks and return real-time analysis dict:
        {
            "exercise": str,
            "reps": int,
            "target_reps": int,
            "stage": str,
            "angle": float,
            "form_status": str ("GOOD" | "ADJUST" | "WARNING" | "NO_BODY"),
            "accuracy": int,
            "feedback": str,
            "voice_cue": Optional[str],
            "is_complete": bool
        }
        """
        pass

    def get_summary(self) -> Dict[str, Any]:
        """Generates comprehensive session summary analytics."""
        duration = round(time.time() - self.session_start_time, 1)
        avg_accuracy = round(sum(self.rep_scores) / len(self.rep_scores)) if self.rep_scores else self.accuracy
        return {
            "exercise": self.name,
            "total_reps": self.reps,
            "correct_reps": self.correct_reps,
            "incorrect_reps": self.incorrect_reps,
            "target_reps": self.target_reps,
            "duration_seconds": duration,
            "posture_score": avg_accuracy,
            "common_mistakes": self.mistakes_log,
            "status": "COMPLETED" if self.reps >= self.target_reps else "IN_PROGRESS"
        }
