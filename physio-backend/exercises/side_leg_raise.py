from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class SideLegRaiseExercise(BaseExercise):
    """
    Side Leg Raise (Hip Abduction) Exercise Detector
    
    Landmarks:
    - 23, 24: Hips
    - 25, 26: Knees
    - 27, 28: Ankles
    
    Logic:
    - Legs together: Angle < 25° (Stage = DOWN)
    - Leg raised laterally: Angle > 45° (Stage = UP)
    - Torso upright check
    """
    def __init__(self, target_reps: int = 12):
        super().__init__(name="Side Leg Raises", target_reps=target_reps, voice_cooldown=2.0)
        self.rep_had_bad_form = False

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 29:
            self.form_status = "NO_BODY"
            self.feedback = "Ensure your entire body is visible in camera."
            return self._build_result(voice_cue)

        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_ankle = landmarks[27]
        right_ankle = landmarks[28]

        # Calculate angle between leg and vertical trunk
        left_abduct_angle = calculate_angle(right_hip, left_hip, left_ankle)
        right_abduct_angle = calculate_angle(left_hip, right_hip, right_ankle)
        raw_angle = max(abs(left_abduct_angle - 90.0), abs(right_abduct_angle - 90.0))
        self.joint_angle = self.smoother.update(raw_angle)

        if self.joint_angle > 40.0:
            if self.stage == "DOWN" or self.stage == "RAISING":
                self.stage = "UP"
                self.form_status = "GOOD"
                self.feedback = "Leg abducted laterally! Hold and lower slowly."
                if self.should_voice("Good lateral raise"):
                    voice_cue = "Good lift, lower slowly"

        elif self.joint_angle < 18.0:
            if self.stage == "UP":
                self.reps += 1
                self.correct_reps += 1
                self.rep_scores.append(95)
                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Leg lowered. Keep core braced and lift smoothly."
            else:
                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Lift leg out to the side without leaning your torso."

        elif 18.0 <= self.joint_angle <= 40.0:
            if self.stage == "DOWN":
                self.stage = "RAISING"
                self.feedback = "Lifting leg laterally..."

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
