import cv2


def start_camera():
    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("❌ Could not open camera")
        return

    print("✅ Camera started")
    print("Press Q to close the camera")

    while True:
        success, frame = camera.read()

        if not success:
            print("❌ Could not read camera frame")
            break

        frame = cv2.flip(frame, 1)

        cv2.putText(
            frame,
            "Vaidya AI - Physiotherapy",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

        cv2.imshow(
            "Vaidya AI Physiotherapy",
            frame
        )

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    start_camera()
    