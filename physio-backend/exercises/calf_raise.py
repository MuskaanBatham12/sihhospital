from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class CalfRaiseExercise(BaseExercise):
    """
    Calf / Heel Raise Exercise Detector
    
    Landmarks:
    - 25, 26: Knees
    - 27, 28: Ankles
    - 31, 32: Foot indexes / Toes
    
    Logic:
    - Heels flat: Ankle extension angle < 110° (Stage = FLAT)
    - Plantarflexed up on toes: Ankle angle > 135° (Stage = UP)
    """
    def __init__(self, target_reps: int = 15):
        super().__init__(name="Calf Raises", target_reps=target_reps, voice_cooldown=2.0)

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 33:
            self.form_status = "NO_BODY"
            self.feedback = "Ensure your legs and feet are visible."
            return self._build_result(voice_cue)

        left_knee = landmarks[25]
        right_knee = landmarks[26]
        left_ankle = landmarks[27]
        right_ankle = landmarks[28]
        left_toe = landmarks[31]
        right_toe = landmarks[32]

        left_angle = calculate_angle(left_knee, left_ankle, left_toe)
        right_angle = calculate_angle(right_knee, right_ankle, right_toe)
        raw_angle = (left_angle + right_angle) / 2.0
        self.joint_angle = self.smoother.update(raw_angle)

        if self.joint_angle > 130.0:
            if self.stage == "FLAT" or self.stage == "RISING":
                self.stage = "UP"
                self.form_status = "GOOD"
                self.feedback = "High on toes! Squeeze calves and lower slowly."
                if self.should_voice("Calves squeezed"):
                    voice_cue = "Squeeze calves, now lower"

        elif self.joint_angle < 110.0:
            if self.stage == "UP":
                self.reps += 1
                self.correct_reps += 1
                self.rep_scores.append(95)
                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "FLAT"
                self.form_status = "GOOD"
                self.feedback = "Heels on ground. Rise smoothly onto balls of feet."
            else:
                self.stage = "FLAT"
                self.form_status = "GOOD"
                self.feedback = "Push down through balls of feet to elevate heels."

        elif 110.0 <= self.joint_angle <= 130.0:
            if self.stage == "FLAT":
                self.stage = "RISING"

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
