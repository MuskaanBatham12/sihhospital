from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class ShoulderRaiseExercise(BaseExercise):
    """
    Shoulder Lateral Raise Exercise Detector
    
    Landmarks:
    - 23, 24: Hips
    - 11, 12: Shoulders
    - 13, 14: Elbows / 15, 16: Wrists
    
    Logic:
    - Arms at side: Angle < 35° (Stage = DOWN)
    - Arms raised to shoulder level: Angle 80° - 100° (Stage = UP)
    - Check for shrugging or over-raising (> 110°)
    """
    def __init__(self, target_reps: int = 12):
        super().__init__(name="Shoulder Raises", target_reps=target_reps, voice_cooldown=2.0)
        self.rep_had_bad_form = False

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 25:
            self.form_status = "NO_BODY"
            self.feedback = "Step back to show your torso and both arms."
            return self._build_result(voice_cue)

        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_elbow = landmarks[13]
        right_elbow = landmarks[14]

        left_angle = calculate_angle(left_hip, left_shoulder, left_elbow)
        right_angle = calculate_angle(right_hip, right_shoulder, right_elbow)
        raw_angle = max(left_angle, right_angle)
        self.joint_angle = self.smoother.update(raw_angle)

        if self.joint_angle > 80.0:
            if self.stage == "DOWN" or self.stage == "RAISING":
                self.stage = "UP"
                if self.joint_angle > 115.0:
                    self.form_status = "ADJUST"
                    self.feedback = "Stop at shoulder height. Do not over-raise."
                    self.log_mistake("Raising arms above shoulder level")
                    self.rep_had_bad_form = True
                    if self.should_voice("Stop at shoulder height"):
                        voice_cue = "Shoulder height only"
                else:
                    self.form_status = "GOOD"
                    self.feedback = "Arms at shoulder level. Hold briefly and lower."
                    if self.should_voice("Good height"):
                        voice_cue = "Good height, slowly lower"

        elif self.joint_angle < 35.0:
            if self.stage == "UP":
                self.reps += 1
                if self.rep_had_bad_form:
                    self.incorrect_reps += 1
                    self.accuracy = max(70, self.accuracy - 4)
                    self.rep_scores.append(80)
                else:
                    self.correct_reps += 1
                    self.accuracy = min(100, self.accuracy + 2)
                    self.rep_scores.append(95)

                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "DOWN"
                self.rep_had_bad_form = False
                self.form_status = "GOOD"
                self.feedback = "Arms reset at sides. Raise smoothly without swinging."
            else:
                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Raise your arms out to the sides to shoulder height."

        elif 35.0 <= self.joint_angle <= 80.0:
            if self.stage == "DOWN":
                self.stage = "RAISING"
                self.feedback = "Raising arms smoothly..."
            elif self.stage == "UP":
                self.stage = "LOWERING"
                self.feedback = "Lowering arms with control..."

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
