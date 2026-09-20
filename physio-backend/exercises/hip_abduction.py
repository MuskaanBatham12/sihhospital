from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class HipAbductionExercise(BaseExercise):
    """
    Hip Abduction (Standing / Lying) Exercise Detector
    
    Landmarks:
    - 23, 24: Hips
    - 25, 26: Knees
    - 27, 28: Ankles
    """
    def __init__(self, target_reps: int = 12):
        super().__init__(name="Hip Abduction", target_reps=target_reps, voice_cooldown=2.0)

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 29:
            self.form_status = "NO_BODY"
            self.feedback = "Position full lower body in frame."
            return self._build_result(voice_cue)

        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_knee = landmarks[25]
        right_knee = landmarks[26]

        left_angle = calculate_angle(right_hip, left_hip, left_knee)
        right_angle = calculate_angle(left_hip, right_hip, right_knee)
        raw_angle = max(abs(left_angle - 90.0), abs(right_angle - 90.0))
        self.joint_angle = self.smoother.update(raw_angle)

        if self.joint_angle > 35.0:
            if self.stage == "DOWN" or self.stage == "ABDUCTING":
                self.stage = "UP"
                self.form_status = "GOOD"
                self.feedback = "Hip abducted! Hold briefly and return."
                if self.should_voice("Good hip abduction"):
                    voice_cue = "Hold and lower"

        elif self.joint_angle < 15.0:
            if self.stage == "UP":
                self.reps += 1
                self.correct_reps += 1
                self.rep_scores.append(96)
                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Leg centered. Prepare next abduction."
            else:
                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Move leg outward away from the midline."

        elif 15.0 <= self.joint_angle <= 35.0:
            if self.stage == "DOWN":
                self.stage = "ABDUCTING"

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
