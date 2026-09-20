import os
import cv2
import numpy as np
from typing import Any, List, Optional, Tuple

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


class PoseDetector:
    """
    Modern MediaPipe Tasks API (v1.0.1+) Pose Landmarker implementation.
    Loads models/pose_landmarker_lite.task in IMAGE running mode.
    """
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            # Resolve relative to current file
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(base_dir, "models", "pose_landmarker_lite.task")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"MediaPipe Pose Landmarker model not found at {model_path}")

        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.detector = vision.PoseLandmarker.create_from_options(options)

    def detect(self, image_rgb: np.ndarray) -> Optional[List[Any]]:
        """
        Runs pose landmark detection on an RGB image (NumPy array).
        Returns a list of 33 NormalizedLandmark objects, or None if no pose is detected.
        """
        if image_rgb is None or image_rgb.size == 0:
            return None

        # Ensure contiguous uint8 array
        if not image_rgb.flags['C_CONTIGUOUS']:
            image_rgb = np.ascontiguousarray(image_rgb)

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        detection_result = self.detector.detect(mp_image)

        if detection_result.pose_landmarks and len(detection_result.pose_landmarks) > 0:
            return detection_result.pose_landmarks[0]
        return None

    def draw_skeleton(self, frame: np.ndarray, landmarks: List[Any]) -> np.ndarray:
        """
        Draws high-visibility aesthetic skeleton lines and joint dots on a BGR frame.
        """
        if landmarks is None or len(landmarks) < 33:
            return frame

        h, w, _ = frame.shape
        connections = [
            (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),  # Upper body
            (11, 23), (12, 24), (23, 24),                     # Torso
            (23, 25), (25, 27), (24, 26), (26, 28),           # Lower body
            (27, 31), (28, 32)                                # Feet
        ]

        # Draw connecting bones
        for start_idx, end_idx in connections:
            p1 = landmarks[start_idx]
            p2 = landmarks[end_idx]
            pt1 = (int(p1.x * w), int(p1.y * h))
            pt2 = (int(p2.x * w), int(p2.y * h))
            cv2.line(frame, pt1, pt2, (6, 182, 212), 3)  # Cyan lines

        # Draw joint nodes
        for idx, lm in enumerate(landmarks):
            cx, cy = int(lm.x * w), int(lm.y * h)
            # Highlight key joints with larger glowing dots
            if idx in [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]:
                cv2.circle(frame, (cx, cy), 6, (16, 185, 129), -1)  # Emerald green
                cv2.circle(frame, (cx, cy), 8, (255, 255, 255), 1)  # White outline
            else:
                cv2.circle(frame, (cx, cy), 3, (0, 255, 255), -1)

        return frame

    def close(self):
        """Closes the underlying MediaPipe landmarker."""
        if hasattr(self, 'detector') and self.detector:
            self.detector.close()