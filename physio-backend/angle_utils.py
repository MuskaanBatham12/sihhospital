import math
from collections import deque
from typing import Any, Tuple, Union


def get_coords(point: Any) -> Tuple[float, float]:
    """
    Extracts (x, y) coordinates from various point formats:
    - Landmark object with .x, .y attributes
    - Dictionary with 'x', 'y' keys
    - Tuple or List [x, y]
    """
    if hasattr(point, "x") and hasattr(point, "y"):
        return float(point.x), float(point.y)
    elif isinstance(point, dict) and "x" in point and "y" in point:
        return float(point["x"]), float(point["y"])
    elif isinstance(point, (list, tuple)) and len(point) >= 2:
        return float(point[0]), float(point[1])
    raise ValueError(f"Invalid coordinate format: {point}")


def calculate_angle(a: Any, b: Any, c: Any) -> float:
    """
    Calculates the 2D joint angle at vertex point 'b' formed by line segments BA and BC.
    
    Parameters:
    - a: Starting point (e.g. Hip)
    - b: Vertex / Joint point (e.g. Knee)
    - c: Ending point (e.g. Ankle)
    
    Returns:
    - Angle in degrees [0.0, 180.0]
    """
    try:
        ax, ay = get_coords(a)
        bx, by = get_coords(b)
        cx, cy = get_coords(c)
    except Exception:
        return 0.0

    radians = math.atan2(cy - by, cx - bx) - math.atan2(ay - by, ax - bx)
    angle = math.degrees(radians)
    angle = abs(angle)

    if angle > 180.0:
        angle = 360.0 - angle

    return round(angle, 1)


def calculate_distance(a: Any, b: Any) -> float:
    """
    Calculates the Euclidean distance between two 2D points.
    """
    try:
        ax, ay = get_coords(a)
        bx, by = get_coords(b)
        return math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
    except Exception:
        return 0.0


class AngleSmoother:
    """
    Maintains a rolling window of angles to reduce noise from single-frame landmark jitter.
    """
    def __init__(self, window_size: int = 5):
        self.history = deque(maxlen=window_size)

    def update(self, angle: float) -> float:
        self.history.append(angle)
        return round(sum(self.history) / len(self.history), 1)

    def reset(self):
        self.history.clear()
