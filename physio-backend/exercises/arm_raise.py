from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class ArmRaiseExercise(BaseExercise):
    """
    Arm Extension / Overhead Arm Raise Exercise Detector
    
    Landmarks:
    - 23, 24: Hips
    - 11, 12: Shoulders
    - 13, 14: Elbows
    - 15, 16: Wrists
    
    Logic:
    - Arms down: Angle < 40° (Stage = DOWN)
    - Arms overhead: Angle > 155° (Stage = UP)
    """
    def __init__(self, target_reps: int = 10):
        super().__init__(name="Arm Raises", target_reps=target_reps, voice_cooldown=2.0)
        self.rep_had_bad_form = False

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 25:
            self.form_status = "NO_BODY"
            self.feedback = "Ensure your upper body and arms are in frame."
            return self._build_result(voice_cue)

        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]

        left_angle = calculate_angle(left_hip, left_shoulder, left_wrist)
        right_angle = calculate_angle(right_hip, right_shoulder, right_wrist)
        raw_angle = (left_angle + right_angle) / 2.0
        self.joint_angle = self.smoother.update(raw_angle)

        if self.joint_angle > 150.0:
            if self.stage == "DOWN" or self.stage == "RAISING":
                self.stage = "UP"
                self.form_status = "GOOD"
                self.feedback = "Full overhead reach! Hold for a moment then lower."
                if self.should_voice("Good extension"):
                    voice_cue = "Full extension, slowly lower"

        elif self.joint_angle < 45.0:
            if self.stage == "UP":
                self.reps += 1
                self.correct_reps += 1
                self.rep_scores.append(95)
                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Arms lowered. Ready for the next raise."
            else:
                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Raise arms straight overhead with controlled motion."

        elif 45.0 <= self.joint_angle <= 150.0:
            if self.stage == "DOWN":
                self.stage = "RAISING"
                self.feedback = "Reaching overhead smoothly..."
            elif self.stage == "UP":
                self.stage = "LOWERING"
                self.feedback = "Lowering arms steadily..."

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
