from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class SitToStandExercise(BaseExercise):
    """
    Sit-to-Stand Functional Mobility Exercise Detector
    
    Landmarks:
    - 23, 24: Hips
    - 25, 26: Knees
    - 27, 28: Ankles
    
    Logic:
    - Seated: Knee angle ~ 90° - 105° (Stage = SEATED)
    - Standing: Knee angle > 160° (Stage = STANDING)
    """
    def __init__(self, target_reps: int = 10):
        super().__init__(name="Sit-to-Stand", target_reps=target_reps, voice_cooldown=2.0)

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 29:
            self.form_status = "NO_BODY"
            self.feedback = "Ensure full seated and standing body is visible."
            return self._build_result(voice_cue)

        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_knee = landmarks[25]
        right_knee = landmarks[26]
        left_ankle = landmarks[27]
        right_ankle = landmarks[28]

        left_angle = calculate_angle(left_hip, left_knee, left_ankle)
        right_angle = calculate_angle(right_hip, right_knee, right_ankle)
        raw_angle = (left_angle + right_angle) / 2.0
        self.joint_angle = self.smoother.update(raw_angle)

        if self.joint_angle > 160.0:
            if self.stage == "SEATED" or self.stage == "STANDING_UP":
                self.stage = "STANDING"
                self.form_status = "GOOD"
                self.feedback = "Fully standing! Now slowly sit back down with control."
                if self.should_voice("Stand tall"):
                    voice_cue = "Stand tall, now sit back slowly"

        elif self.joint_angle < 105.0:
            if self.stage == "STANDING":
                self.reps += 1
                self.correct_reps += 1
                self.rep_scores.append(96)
                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "SEATED"
                self.form_status = "GOOD"
                self.feedback = "Seated securely. Stand up without using hand push if possible."
            else:
                self.stage = "SEATED"
                self.form_status = "GOOD"
                self.feedback = "From seated position, stand up using leg strength."

        elif 105.0 <= self.joint_angle <= 160.0:
            if self.stage == "SEATED":
                self.stage = "STANDING_UP"
                self.feedback = "Pushing up to stand..."

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
