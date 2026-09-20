import cv2
import threading
import time
import pyttsx3

from pose_detection import PoseDetector
from exercises import get_exercise, list_exercises


# Initialize voice engine
try:
    voice_engine = pyttsx3.init()
    voice_engine.setProperty("rate", 160)
    voice_lock = threading.Lock()
except Exception as e:
    voice_engine = None
    print(f"Voice engine initialization notice: {e}")


def speak(text: str):
    """Speaks text in a non-blocking background daemon thread."""
    if not voice_engine:
        return

    def _worker():
        try:
            with voice_lock:
                voice_engine.say(text)
                voice_engine.runAndWait()
        except Exception:
            pass

    threading.Thread(target=_worker, daemon=True).start()


def start_camera():
    print("🔥 Starting Vaidya AI Physiotherapy Desktop Harness...")
    
    detector = PoseDetector()
    current_exercise_name = "squats"
    exercise = get_exercise(current_exercise_name)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Error: Could not access webcam. Please ensure no other app is using it.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    speak(f"Starting {exercise.name}. Please step back so your full body is visible.")

    exercises_list = ["squats", "bicep_curls", "shoulder_raises", "lunges", "knee_raises", "calf_raises"]

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Could not read frame from camera.")
            break

        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        landmarks = detector.detect(rgb_frame)

        if landmarks:
            frame = detector.draw_skeleton(frame, landmarks)
            result = exercise.process(landmarks)

            if result.get("voice_cue"):
                speak(result["voice_cue"])

            # Render HUD Overlay
            h, w, _ = frame.shape
            
            # Semi-transparent top bar
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (w, 90), (15, 23, 42), -1)
            cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

            cv2.putText(frame, f"VAIDYA AI • {exercise.name.upper()}", (15, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (6, 182, 212), 2)
            cv2.putText(frame, f"Reps: {exercise.reps}/{exercise.target_reps}", (15, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, f"Angle: {int(exercise.joint_angle)} deg", (200, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (250, 204, 21), 2)

            status_color = (16, 185, 129) if exercise.form_status == "GOOD" else (239, 68, 68) if exercise.form_status == "WARNING" else (245, 158, 11)
            cv2.putText(frame, f"Form: {exercise.form_status}", (380, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.75, status_color, 2)

            # Bottom feedback banner
            cv2.rectangle(frame, (0, h - 45), (w, h), (15, 23, 42), -1)
            cv2.putText(frame, exercise.feedback, (15, h - 16), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        else:
            h, w, _ = frame.shape
            cv2.putText(frame, "NO BODY DETECTED - STEP INTO FRAME", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # Controls instructions
        cv2.putText(frame, "Keys: 1=Squats, 2=Biceps, 3=Shoulders, 4=Lunges, 5=Knees, R=Reset, Q=Quit", (10, frame.shape[0] - 55), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

        cv2.imshow("Vaidya AI - Physiotherapy", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('r'):
            exercise.reset()
            speak("Session reset")
        elif key == ord('1'):
            current_exercise_name = "squats"
            exercise = get_exercise(current_exercise_name)
            speak("Squats selected")
        elif key == ord('2'):
            current_exercise_name = "bicep_curls"
            exercise = get_exercise(current_exercise_name)
            speak("Bicep curls selected")
        elif key == ord('3'):
            current_exercise_name = "shoulder_raises"
            exercise = get_exercise(current_exercise_name)
            speak("Shoulder raises selected")
        elif key == ord('4'):
            current_exercise_name = "lunges"
            exercise = get_exercise(current_exercise_name)
            speak("Lunges selected")
        elif key == ord('5'):
            current_exercise_name = "knee_raises"
            exercise = get_exercise(current_exercise_name)
            speak("Knee raises selected")

    cap.release()
    detector.close()
    cv2.destroyAllWindows()

    summary = exercise.get_summary()
    print("\n" + "=" * 40)
    print("       VAIDYA AI SESSION SUMMARY")
    print("=" * 40)
    print(f"Exercise:        {summary['exercise']}")
    print(f"Total Reps:      {summary['total_reps']}")
    print(f"Correct Reps:    {summary['correct_reps']}")
    print(f"Incorrect Reps:  {summary['incorrect_reps']}")
    print(f"Accuracy Score:  {summary['posture_score']}%")
    print(f"Duration:        {summary['duration_seconds']}s")
    print("=" * 40)


if __name__ == "__main__":
    start_camera()