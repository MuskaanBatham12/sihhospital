from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class LungeExercise(BaseExercise):
    """
    Forward Lunge Exercise Detector
    
    Landmarks:
    - 23, 24: Hips
    - 25, 26: Knees
    - 27, 28: Ankles
    
    Logic:
    - Standing: Knee angles > 155° (Stage = STANDING)
    - Lunge Depth: Lead knee angle ~ 85° - 100° (Stage = LUNGING)
    - Knee over toe check (Knee x vs Ankle x)
    """
    def __init__(self, target_reps: int = 10):
        super().__init__(name="Lunges", target_reps=target_reps, voice_cooldown=2.0)
        self.rep_had_bad_form = False

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 29:
            self.form_status = "NO_BODY"
            self.feedback = "Step back to show your full lower body and legs."
            return self._build_result(voice_cue)

        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_knee = landmarks[25]
        right_knee = landmarks[26]
        left_ankle = landmarks[27]
        right_ankle = landmarks[28]

        left_angle = calculate_angle(left_hip, left_knee, left_ankle)
        right_angle = calculate_angle(right_hip, right_knee, right_ankle)

        # Active lunge leg has smaller knee angle
        lead_knee_angle = min(left_knee_angle, right_angle)
        self.joint_angle = self.smoother.update(lead_knee_angle)

        if self.joint_angle < 98.0:
            if self.stage == "STANDING" or self.stage == "GOING_DOWN":
                self.stage = "LUNGING"
                if self.joint_angle < 70.0:
                    self.form_status = "ADJUST"
                    self.feedback = "Don't collapse lead knee too far forward."
                    self.log_mistake("Excessive lead knee flexion")
                    self.rep_had_bad_form = True
                    if self.should_voice("Keep knee behind toes"):
                        voice_cue = "Keep knee behind toes"
                else:
                    self.form_status = "GOOD"
                    self.feedback = "Great 90-degree lunge depth! Push back to start."
                    if self.should_voice("Good lunge depth"):
                        voice_cue = "Great lunge, now push back"

        elif self.joint_angle > 155.0:
            if self.stage == "LUNGING":
                self.reps += 1
                if self.rep_had_bad_form:
                    self.incorrect_reps += 1
                    self.accuracy = max(70, self.accuracy - 4)
                    self.rep_scores.append(82)
                else:
                    self.correct_reps += 1
                    self.accuracy = min(100, self.accuracy + 2)
                    self.rep_scores.append(96)

                cue = f"Repetition {self.reps} completed."
                if self.should_voice(cue):
                    voice_cue = cue

                self.stage = "STANDING"
                self.rep_had_bad_form = False
                self.form_status = "GOOD"
                self.feedback = "Standing reset. Step forward with next leg."
            else:
                self.stage = "STANDING"
                self.form_status = "GOOD"
                self.feedback = "Step forward into a lunge, lowering both knees to 90 degrees."

        elif 98.0 <= self.joint_angle <= 155.0:
            if self.stage == "STANDING":
                self.stage = "GOING_DOWN"
                self.feedback = "Stepping into lunge..."

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
