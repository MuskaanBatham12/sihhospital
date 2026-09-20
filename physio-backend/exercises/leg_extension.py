from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class LegExtensionExercise(BaseExercise):
    """
    Seated Leg Extension (Knee Mobility / Rehab) Exercise Detector
    
    Landmarks:
    - 23, 24: Hips
    - 25, 26: Knees
    - 27, 28: Ankles
    
    Logic:
    - Seated relaxed: Knee angle ~ 90° (Stage = DOWN)
    - Extended straight: Knee angle > 155° (Stage = EXTENDED)
    """
    def __init__(self, target_reps: int = 12):
        super().__init__(name="Leg Extension", target_reps=target_reps, voice_cooldown=2.0)

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 29:
            self.form_status = "NO_BODY"
            self.feedback = "Ensure seated legs and ankles are visible."
            return self._build_result(voice_cue)

        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_knee = landmarks[25]
        right_knee = landmarks[26]
        left_ankle = landmarks[27]
        right_ankle = landmarks[28]

        left_angle = calculate_angle(left_hip, left_knee, left_ankle)
        right_angle = calculate_angle(right_hip, right_knee, right_ankle)
        raw_angle = max(left_angle, right_angle)
        self.joint_angle = self.smoother.update(raw_angle)

        if self.joint_angle > 150.0:
            if self.stage == "DOWN" or self.stage == "EXTENDING":
                self.stage = "EXTENDED"
                self.form_status = "GOOD"
                self.feedback = "Leg fully extended! Hold quadricep contraction and lower."
                if self.should_voice("Good extension"):
                    voice_cue = "Full extension, slowly lower"

        elif self.joint_angle < 100.0:
            if self.stage == "EXTENDED":
                self.reps += 1
                self.correct_reps += 1
                self.rep_scores.append(97)
                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Knee flexed back to 90 degrees. Ready for next extension."
            else:
                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Extend your lower leg straight forward."

        elif 100.0 <= self.joint_angle <= 150.0:
            if self.stage == "DOWN":
                self.stage = "EXTENDING"
                self.feedback = "Extending knee forward..."

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
