from typing import Any, Dict, List
from angle_utils import calculate_angle
from exercises.base import BaseExercise


class SquatExercise(BaseExercise):
    """
    Squat Exercise Detector
    
    Landmarks Used:
    - 23: Left Hip, 24: Right Hip
    - 25: Left Knee, 26: Right Knee
    - 27: Left Ankle, 28: Right Ankle
    - 11: Left Shoulder, 12: Right Shoulder
    
    Logic:
    - Standing: Knee angle > 150° (Stage = STANDING)
    - Descending: Knee angle 105° - 149° (Stage = GOING_DOWN)
    - Squat depth: Knee angle < 105° (Stage = SQUAT_BOTTOM)
    - Ascending: Knee angle rising back > 150° -> Rep + 1 (Stage = STANDING)
    """
    def __init__(self, target_reps: int = 10):
        super().__init__(name="Squats", target_reps=target_reps, voice_cooldown=2.0)
        self.min_depth_reached = False
        self.rep_had_bad_form = False

    def process(self, landmarks: List[Any]) -> Dict[str, Any]:
        voice_cue = None

        if not landmarks or len(landmarks) < 29:
            self.form_status = "NO_BODY"
            self.feedback = "Step back so your full body is visible."
            return self._build_result(voice_cue)

        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_knee = landmarks[25]
        right_knee = landmarks[26]
        left_ankle = landmarks[27]
        right_ankle = landmarks[28]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]

        # Calculate bilateral knee angles
        left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
        raw_angle = (left_knee_angle + right_knee_angle) / 2.0
        self.joint_angle = self.smoother.update(raw_angle)

        # Calculate torso back angle (Shoulder - Hip - Knee)
        left_torso_angle = calculate_angle(left_shoulder, left_hip, left_knee)
        right_torso_angle = calculate_angle(right_shoulder, right_hip, right_knee)
        torso_angle = (left_torso_angle + right_torso_angle) / 2.0

        # State Machine Transitions
        if self.joint_angle > 150.0:
            if self.stage == "SQUAT_BOTTOM" or self.stage == "GOING_UP" or self.stage == "GOING_DOWN":
                if self.min_depth_reached:
                    # Completed Repetition
                    self.reps += 1
                    if self.rep_had_bad_form:
                        self.incorrect_reps += 1
                        self.accuracy = max(70, self.accuracy - 5)
                        self.rep_scores.append(self.accuracy)
                    else:
                        self.correct_reps += 1
                        self.accuracy = min(100, self.accuracy + 2)
                        self.rep_scores.append(96)

                    cue = f"Repetition {self.reps} completed. Great job!" if not self.rep_had_bad_form else f"Repetition {self.reps} completed."
                    if self.should_voice(cue):
                        voice_cue = cue

                    self.stage = "STANDING"
                    self.min_depth_reached = False
                    self.rep_had_bad_form = False
                    self.form_status = "GOOD"
                    self.feedback = "Good form! Stand tall and begin next rep."
                else:
                    self.stage = "STANDING"
                    self.form_status = "GOOD"
                    self.feedback = "Standing position. Bend knees to squat."
            else:
                self.stage = "STANDING"
                self.form_status = "GOOD"
                self.feedback = "Standing position. Bend knees and lower hips to squat."

        elif self.joint_angle < 105.0:
            # Reached full squat depth
            self.stage = "SQUAT_BOTTOM"
            self.min_depth_reached = True

            # Form evaluation
            if self.joint_angle < 65.0:
                self.form_status = "WARNING"
                self.feedback = "Don't squat too low. Protect your knees."
                self.log_mistake("Excessive squat depth below 65°")
                self.rep_had_bad_form = True
                if self.should_voice("Don't squat too deep"):
                    voice_cue = "Don't squat too deep"
            elif torso_angle < 60.0:
                self.form_status = "ADJUST"
                self.feedback = "Keep your chest up and back straight."
                self.log_mistake("Leaning too far forward")
                self.rep_had_bad_form = True
                if self.should_voice("Keep your chest up"):
                    voice_cue = "Keep your chest up"
            else:
                self.form_status = "GOOD"
                self.feedback = "Excellent squat depth! Drive up through heels."
                if self.should_voice("Hold and drive up"):
                    voice_cue = "Good depth, now push up"

        elif 105.0 <= self.joint_angle <= 150.0:
            if self.stage == "STANDING" or self.stage == "GOING_DOWN" or self.stage == "START":
                self.stage = "GOING_DOWN"
                self.feedback = "Lowering... keep knees aligned with toes."
                self.form_status = "GOOD"
            elif self.stage == "SQUAT_BOTTOM" or self.stage == "GOING_UP":
                self.stage = "GOING_UP"
                self.feedback = "Pushing up back to standing position."
                self.form_status = "GOOD"

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
