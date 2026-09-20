from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class NeckShoulderMobilityExercise(BaseExercise):
    """
    Shoulder & Neck Mobility / Shrugs Exercise Detector
    
    Landmarks:
    - 0: Nose / 7, 8: Ears
    - 11, 12: Shoulders
    - 23, 24: Hips
    
    Logic:
    - Normal neutral: Shoulder elevation angle ~ 85° (Stage = NEUTRAL)
    - Shrugged / Elevated: Shoulder shrug elevation > 105° (Stage = SHRUG)
    """
    def __init__(self, target_reps: int = 10):
        super().__init__(name="Shoulder/Neck Mobility", target_reps=target_reps, voice_cooldown=2.0)

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 13:
            self.form_status = "NO_BODY"
            self.feedback = "Ensure your head, neck, and shoulders are in view."
            return self._build_result(voice_cue)

        left_ear = landmarks[7] if len(landmarks) > 7 else landmarks[0]
        right_ear = landmarks[8] if len(landmarks) > 8 else landmarks[0]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_hip = landmarks[23] if len(landmarks) > 23 else landmarks[11]

        left_shrug = calculate_angle(left_ear, left_shoulder, left_hip)
        right_shrug = calculate_angle(right_ear, right_shoulder, left_hip)
        raw_angle = (left_shrug + right_shrug) / 2.0
        self.joint_angle = self.smoother.update(raw_angle)

        if self.joint_angle < 120.0:
            if self.stage == "NEUTRAL" or self.stage == "SHRUGGING":
                self.stage = "SHRUG"
                self.form_status = "GOOD"
                self.feedback = "Shoulders shrugged up! Hold for 2 seconds and release."
                if self.should_voice("Hold shrug"):
                    voice_cue = "Hold shrug, now relax"

        elif self.joint_angle > 145.0:
            if self.stage == "SHRUG":
                self.reps += 1
                self.correct_reps += 1
                self.rep_scores.append(98)
                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "NEUTRAL"
                self.form_status = "GOOD"
                self.feedback = "Shoulders relaxed down. Gently shrug upward again."
            else:
                self.stage = "NEUTRAL"
                self.form_status = "GOOD"
                self.feedback = "Elevate shoulders straight up towards ears smoothly."

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
