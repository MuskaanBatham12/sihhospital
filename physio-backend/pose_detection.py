import cv2
import mediapipe as mp
import math
import pyttsx3
import threading
import time

from collections import deque
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# ============================================================
# VAIDYA AI - PHYSIOTHERAPY ENGINE
# ============================================================

print("🔥 Vaidya AI Physiotherapy Starting...")


# ============================================================
# VOICE ASSISTANT
# ============================================================

voice = pyttsx3.init()

voice.setProperty("rate", 160)

voice_lock = threading.Lock()


def speak(text):

    def voice_thread():

        with voice_lock:

            voice.say(text)
            voice.runAndWait()

    threading.Thread(
        target=voice_thread,
        daemon=True
    ).start()


# ============================================================
# ANGLE CALCULATION
# ============================================================

def calculate_angle(a, b, c):

    angle = math.degrees(
        math.atan2(c.y - b.y, c.x - b.x)
        -
        math.atan2(a.y - b.y, a.x - b.x)
    )

    angle = abs(angle)

    if angle > 180:
        angle = 360 - angle

    return angle


# ============================================================
# DISTANCE
# ============================================================

def calculate_distance(a, b):

    return math.sqrt(
        (a.x - b.x) ** 2 +
        (a.y - b.y) ** 2
    )


# ============================================================
# MEDIAPIPE MODEL
# ============================================================

MODEL_PATH = "models/pose_landmarker_lite.task"


base_options = python.BaseOptions(
    model_asset_path=MODEL_PATH
)


options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE,
    num_poses=1,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5
)


detector = vision.PoseLandmarker.create_from_options(
    options
)


# ============================================================
# CAMERA
# ============================================================

camera = cv2.VideoCapture(0)


if not camera.isOpened():

    print("❌ Camera could not open")

    detector.close()

    exit()


print("✅ Camera started")
print("✅ MediaPipe started")
print("💪 Physiotherapy Engine Ready")


# ============================================================
# VARIABLES
# ============================================================

exercise = "BICEP CURL"

reps = 0

stage = "DOWN"

form_status = "READY"

feedback = "Start exercise"

session_start = time.time()


# ============================================================
# ANGLE SMOOTHING
# ============================================================

angle_history = deque(maxlen=5)


# ============================================================
# LAST VOICE MESSAGE
# ============================================================

last_feedback_time = 0

VOICE_COOLDOWN = 2


def feedback_voice(message):

    global last_feedback_time

    current_time = time.time()

    if current_time - last_feedback_time > VOICE_COOLDOWN:

        speak(message)

        last_feedback_time = current_time


# ============================================================
# EXERCISE CHANGE
# ============================================================

def change_exercise(name):

    global exercise
    global reps
    global stage
    global angle_history

    exercise = name

    reps = 0

    stage = "DOWN"

    angle_history.clear()

    feedback_voice(
        f"{name} selected"
    )


# ============================================================
# SESSION START
# ============================================================

speak(
    "Vaidya AI physiotherapy started. "
    "Select an exercise."
)


# ============================================================
# MAIN LOOP
# ============================================================

while True:

    success, frame = camera.read()


    if not success:

        print("❌ Frame could not be read")

        break


    # Mirror camera

    frame = cv2.flip(
        frame,
        1
    )


    # ========================================================
    # IMAGE CONVERSION
    # ========================================================

    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )


    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )


    # ========================================================
    # POSE DETECTION
    # ========================================================

    result = detector.detect(
        mp_image
    )


    # ========================================================
    # PERSON DETECTED
    # ========================================================

    if result.pose_landmarks:

        landmarks = result.pose_landmarks[0]


        height, width, _ = frame.shape


        # ====================================================
        # LANDMARKS
        # ====================================================

        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]

        left_elbow = landmarks[13]
        right_elbow = landmarks[14]

        left_wrist = landmarks[15]
        right_wrist = landmarks[16]

        left_hip = landmarks[23]
        right_hip = landmarks[24]

        left_knee = landmarks[25]
        right_knee = landmarks[26]

        left_ankle = landmarks[27]
        right_ankle = landmarks[28]


        # ====================================================
        # DRAW LANDMARKS
        # ====================================================

        for landmark in landmarks:

            x = int(
                landmark.x * width
            )

            y = int(
                landmark.y * height
            )

            cv2.circle(
                frame,
                (x, y),
                4,
                (0, 255, 0),
                -1
            )


        # ====================================================
        # BICEP CURL
        # ====================================================

        if exercise == "BICEP CURL":

            left_angle = calculate_angle(
                left_shoulder,
                left_elbow,
                left_wrist
            )


            right_angle = calculate_angle(
                right_shoulder,
                right_elbow,
                right_wrist
            )


            # Choose arm with smaller angle
            # This allows either arm.

            if left_angle < right_angle:

                angle = left_angle

                active_elbow = left_elbow
                active_shoulder = left_shoulder

            else:

                angle = right_angle

                active_elbow = right_elbow
                active_shoulder = right_shoulder


            # Smooth

            angle_history.append(angle)

            angle = sum(
                angle_history
            ) / len(angle_history)


            # ----------------------------------------------
            # REP LOGIC
            # ----------------------------------------------

            if angle < 50:

                stage = "UP"


            elif angle > 140 and stage == "UP":

                reps += 1

                stage = "DOWN"

                feedback_voice(
                    f"{reps} repetition complete"
                )


            # ----------------------------------------------
            # FORM
            # ----------------------------------------------

            elbow_movement = abs(
                active_elbow.x -
                active_shoulder.x
            )


            if elbow_movement < 0.20:

                form_status = "GOOD"

                feedback = "Good form"

            else:

                form_status = "CHECK"

                feedback = "Keep your elbow stable"

                feedback_voice(
                    "Keep your elbow stable"
                )


        # ====================================================
        # SHOULDER RAISE
        # ====================================================

        elif exercise == "SHOULDER RAISE":

            left_angle = calculate_angle(
                left_hip,
                left_shoulder,
                left_elbow
            )


            right_angle = calculate_angle(
                right_hip,
                right_shoulder,
                right_elbow
            )


            angle = max(
                left_angle,
                right_angle
            )


            angle_history.append(angle)

            angle = sum(
                angle_history
            ) / len(angle_history)


            # ----------------------------------------------
            # REP LOGIC
            # ----------------------------------------------

            if angle > 80:

                stage = "UP"


            elif angle < 40 and stage == "UP":

                reps += 1

                stage = "DOWN"

                feedback_voice(
                    f"{reps} shoulder raise complete"
                )


            form_status = "GOOD"

            feedback = "Raise your arm smoothly"


        # ====================================================
        # SQUAT
        # ====================================================

        elif exercise == "SQUAT":

            left_angle = calculate_angle(
                left_hip,
                left_knee,
                left_ankle
            )


            right_angle = calculate_angle(
                right_hip,
                right_knee,
                right_ankle
            )


            angle = (
                left_angle +
                right_angle
            ) / 2


            angle_history.append(angle)

            angle = sum(
                angle_history
            ) / len(angle_history)


            # ----------------------------------------------
            # REP LOGIC
            # ----------------------------------------------

            if angle < 100:

                stage = "DOWN"


            elif angle > 160 and stage == "DOWN":

                reps += 1

                stage = "UP"

                feedback_voice(
                    f"{reps} squat complete"
                )


            # ----------------------------------------------
            # FORM
            # ----------------------------------------------

            if angle < 70:

                form_status = "CHECK"

                feedback = "Do not squat too deep"

            else:

                form_status = "GOOD"

                feedback = "Keep your back straight"


        # ====================================================
        # UI
        # ====================================================

        cv2.putText(
            frame,
            "VAIDYA AI",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 255),
            2
        )


        cv2.putText(
            frame,
            f"Exercise: {exercise}",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )


        cv2.putText(
            frame,
            f"Angle: {int(angle)}",
            (20, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2
        )


        cv2.putText(
            frame,
            f"Reps: {reps}",
            (20, 160),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 255),
            2
        )


        cv2.putText(
            frame,
            f"Stage: {stage}",
            (20, 200),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )


        cv2.putText(
            frame,
            f"Form: {form_status}",
            (20, 240),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )


        cv2.putText(
            frame,
            feedback,
            (20, 280),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2
        )


    # ========================================================
    # NO PERSON
    # ========================================================

    else:

        cv2.putText(
            frame,
            "NO BODY DETECTED",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 0, 255),
            2
        )


    # ========================================================
    # CONTROLS
    # ========================================================

    cv2.putText(
        frame,
        "1: Bicep | 2: Shoulder | 3: Squat | R: Reset | Q: Quit",
        (20, height - 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 255, 255),
        2
    )


    # ========================================================
    # SHOW
    # ========================================================

    cv2.imshow(
        "Vaidya AI - Physiotherapy",
        frame
    )


    # ========================================================
    # KEYBOARD
    # ========================================================

    key = cv2.waitKey(1) & 0xFF


    # Bicep Curl

    if key == ord("1"):

        change_exercise(
            "BICEP CURL"
        )


    # Shoulder Raise

    elif key == ord("2"):

        change_exercise(
            "SHOULDER RAISE"
        )


    # Squat

    elif key == ord("3"):

        change_exercise(
            "SQUAT"
        )


    # Reset

    elif key == ord("r"):

        reps = 0

        stage = "DOWN"

        angle_history.clear()

        feedback_voice(
            "Repetitions reset"
        )


    # Quit

    elif key == ord("q"):

        break


# ============================================================
# SESSION SUMMARY
# ============================================================

session_time = int(
    time.time() - session_start
)


camera.release()

detector.close()

cv2.destroyAllWindows()


print("")
print("================================")
print("      VAIDYA AI SESSION")
print("================================")
print(f"Exercise: {exercise}")
print(f"Repetitions: {reps}")
print(f"Duration: {session_time} seconds")
print("================================")


speak(
    f"Session completed. "
    f"You completed {reps} repetitions. "
    f"Good work!"
)