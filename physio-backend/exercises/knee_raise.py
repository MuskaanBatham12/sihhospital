from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class KneeRaiseExercise(BaseExercise):
    """
    High Knee Raise Exercise Detector
    
    Landmarks:
    - 11, 12: Shoulders
    - 23, 24: Hips
    - 25, 26: Knees
    
    Logic:
    - Standing: Hip-knee angle > 155° (Stage = DOWN)
    - Knee Raised: Hip-knee angle < 100° (Knee elevated to hip level, Stage = UP)
    """
    def __init__(self, target_reps: int = 12):
        super().__init__(name="Knee Raises", target_reps=target_reps, voice_cooldown=2.0)
        self.rep_had_bad_form = False

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 27:
            self.form_status = "NO_BODY"
            self.feedback = "Ensure full lower body is in frame."
            return self._build_result(voice_cue)

        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_knee = landmarks[25]
        right_knee = landmarks[26]

        left_hip_angle = calculate_angle(left_shoulder, left_hip, left_knee)
        right_hip_angle = calculate_angle(right_shoulder, right_hip, right_knee)
        raw_angle = min(left_hip_angle, right_hip_angle)
        self.joint_angle = self.smoother.update(raw_angle)

        if self.joint_angle < 95.0:
            if self.stage == "DOWN" or self.stage == "LIFTING":
                self.stage = "UP"
                self.form_status = "GOOD"
                self.feedback = "Knee raised to hip height! Lower with control."
                if self.should_voice("High knee reached"):
                    voice_cue = "Good height, lower down"

        elif self.joint_angle > 150.0:
            if self.stage == "UP":
                self.reps += 1
                self.correct_reps += 1
                self.rep_scores.append(95)
                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Feet grounded. Lift alternating knee high."
            else:
                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Lift knee up towards chest level."

        elif 95.0 <= self.joint_angle <= 150.0:
            if self.stage == "DOWN":
                self.stage = "LIFTING"
                self.feedback = "Lifting knee upward..."

        return self._build_result(voice_cue)

    def _build_result(self, voice_cue: str = None) -> Dict[str, Any]:
        return {
            "exercise": self.name,
            "reps": self.reps,
            "correct_reps": self.correct_reps,
            "incorrect_reps": self.incorrect_reps,
            "target_reps": self.target_reps,
            "stage": self.stage,
            "angle": self.joint_angle,
            "form_status": self.form_status,
            "accuracy": self.accuracy,
            "feedback": self.feedback,
            "voice_cue": voice_cue,
            "is_complete": self.reps >= self.target_reps
        }
