from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class BicepCurlExercise(BaseExercise):
    """
    Bicep Curl Exercise Detector
    
    Landmarks:
    - 11, 12: Shoulders
    - 13, 14: Elbows
    - 15, 16: Wrists
    
    Logic:
    - Arm Extended: Elbow angle > 150° (Stage = DOWN)
    - Curled: Elbow angle < 50° (Stage = UP)
    - Elbow Drift Check: Keep elbow close to torso.
    """
    def __init__(self, target_reps: int = 12):
        super().__init__(name="Bicep Curls", target_reps=target_reps, voice_cooldown=2.0)
        self.rep_had_bad_form = False

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 17:
            self.form_status = "NO_BODY"
            self.feedback = "Step back so your upper body and arms are visible."
            return self._build_result(voice_cue)

        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_elbow = landmarks[13]
        right_elbow = landmarks[14]
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]

        left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
        right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)

        # Select the active arm (smaller angle is curling)
        if left_angle < right_angle:
            active_angle = left_angle
            active_elbow = left_elbow
            active_shoulder = left_shoulder
        else:
            active_angle = right_angle
            active_elbow = right_elbow
            active_shoulder = right_shoulder

        self.joint_angle = self.smoother.update(active_angle)

        # Elbow stability check (x-offset between elbow and shoulder)
        elbow_drift = abs(getattr(active_elbow, 'x', 0) - getattr(active_shoulder, 'x', 0))

        if self.joint_angle < 45.0:
            if self.stage == "DOWN" or self.stage == "CURLING_UP":
                self.stage = "UP"
                if elbow_drift > 0.18:
                    self.form_status = "ADJUST"
                    self.feedback = "Keep your elbow pinned to your side."
                    self.log_mistake("Elbow swinging forward")
                    self.rep_had_bad_form = True
                    if self.should_voice("Keep your elbow still"):
                        voice_cue = "Keep elbow still"
                else:
                    self.form_status = "GOOD"
                    self.feedback = "Top of curl reached. Squeeze and slowly lower."

        elif self.joint_angle > 145.0:
            if self.stage == "UP":
                self.reps += 1
                if self.rep_had_bad_form:
                    self.incorrect_reps += 1
                    self.accuracy = max(70, self.accuracy - 5)
                    self.rep_scores.append(78)
                else:
                    self.correct_reps += 1
                    self.accuracy = min(100, self.accuracy + 2)
                    self.rep_scores.append(97)

                cue = f"Repetition {self.reps} completed. Good form!"
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "DOWN"
                self.rep_had_bad_form = False
                self.form_status = "GOOD"
                self.feedback = "Full arm extension complete. Begin next curl."
            else:
                self.stage = "DOWN"
                self.form_status = "GOOD"
                self.feedback = "Arms extended. Curl dumbbell upward smoothly."

        elif 45.0 <= self.joint_angle <= 145.0:
            if self.stage == "DOWN":
                self.stage = "CURLING_UP"
                self.feedback = "Curling up... focus on bicep contraction."
            elif self.stage == "UP":
                self.stage = "LOWERING"
                self.feedback = "Lowering down with controlled tempo."

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
