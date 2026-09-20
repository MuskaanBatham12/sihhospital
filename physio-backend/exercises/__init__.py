from typing import Dict, List, Type
from exercises.base import BaseExercise
from exercises.squat import SquatExercise
from exercises.bicep_curl import BicepCurlExercise
from exercises.shoulder_raise import ShoulderRaiseExercise
from exercises.arm_raise import ArmRaiseExercise
from exercises.lunge import LungeExercise
from exercises.knee_raise import KneeRaiseExercise
from exercises.side_leg_raise import SideLegRaiseExercise
from exercises.hip_abduction import HipAbductionExercise
from exercises.calf_raise import CalfRaiseExercise
from exercises.sit_to_stand import SitToStandExercise
from exercises.leg_extension import LegExtensionExercise
from exercises.neck_shoulder_mobility import NeckShoulderMobilityExercise

EXERCISE_REGISTRY: Dict[str, Type[BaseExercise]] = {
    "squats": SquatExercise,
    "squat": SquatExercise,
    "bicep_curls": BicepCurlExercise,
    "bicep_curl": BicepCurlExercise,
    "shoulder_raises": ShoulderRaiseExercise,
    "shoulder_raise": ShoulderRaiseExercise,
    "arm_raises": ArmRaiseExercise,
    "arm_raise": ArmRaiseExercise,
    "arm_extension": ArmRaiseExercise,
    "lunges": LungeExercise,
    "lunge": LungeExercise,
    "knee_raises": KneeRaiseExercise,
    "knee_raise": KneeRaiseExercise,
    "side_leg_raises": SideLegRaiseExercise,
    "side_leg_raise": SideLegRaiseExercise,
    "hip_abduction": HipAbductionExercise,
    "calf_raises": CalfRaiseExercise,
    "calf_raise": CalfRaiseExercise,
    "sit_to_stand": SitToStandExercise,
    "leg_extension": LegExtensionExercise,
    "neck_shoulder_mobility": NeckShoulderMobilityExercise,
    "shoulder_neck_mobility": NeckShoulderMobilityExercise,
}

EXERCISES_METADATA = [
    {
        "id": "squats",
        "name": "Squats",
        "category": "Lower Body",
        "target": "10 reps",
        "target_reps": 10,
        "icon": "🦵",
        "difficulty": "Moderate",
        "target_muscles": "Quadriceps, Glutes, Hamstrings",
        "instructions": "Keep feet shoulder-width apart, chest up, and bend knees to 90 degrees."
    },
    {
        "id": "shoulder_raises",
        "name": "Shoulder Raises",
        "category": "Upper Body",
        "target": "12 reps",
        "target_reps": 12,
        "icon": "💪",
        "difficulty": "Beginner",
        "target_muscles": "Lateral Deltoids, Trapezius",
        "instructions": "Raise arms out laterally to shoulder height with smooth, controlled motion."
    },
    {
        "id": "bicep_curls",
        "name": "Bicep Curls",
        "category": "Upper Body",
        "target": "12 reps",
        "target_reps": 12,
        "icon": "🏋️",
        "difficulty": "Beginner",
        "target_muscles": "Biceps Brachii, Forearms",
        "instructions": "Keep elbows fixed at sides and curl forearms upward towards shoulders."
    },
    {
        "id": "arm_raises",
        "name": "Arm Raises",
        "category": "Upper Body",
        "target": "10 reps",
        "target_reps": 10,
        "icon": "🙆",
        "difficulty": "Beginner",
        "target_muscles": "Anterior Deltoids, Upper Back",
        "instructions": "Extend arms straight up overhead, pausing at full extension."
    },
    {
        "id": "lunges",
        "name": "Lunges",
        "category": "Lower Body",
        "target": "10 reps",
        "target_reps": 10,
        "icon": "🏃",
        "difficulty": "Intermediate",
        "target_muscles": "Quadriceps, Glutes, Calves",
        "instructions": "Step forward into a lunge until both front and rear knees reach 90 degrees."
    },
    {
        "id": "knee_raises",
        "name": "Knee Raises",
        "category": "Core & Lower",
        "target": "12 reps",
        "target_reps": 12,
        "icon": "🦶",
        "difficulty": "Beginner",
        "target_muscles": "Hip Flexors, Lower Abs",
        "instructions": "Stand tall and lift each knee alternatingly up towards chest level."
    },
    {
        "id": "side_leg_raises",
        "name": "Side Leg Raises",
        "category": "Lower Body",
        "target": "12 reps",
        "target_reps": 12,
        "icon": "🦵",
        "difficulty": "Beginner",
        "target_muscles": "Gluteus Medius, Tensor Fasciae Latae",
        "instructions": "Lift one leg out to the side without tilting your upper torso."
    },
    {
        "id": "hip_abduction",
        "name": "Hip Abduction",
        "category": "Lower Body",
        "target": "12 reps",
        "target_reps": 12,
        "icon": "🤸",
        "difficulty": "Beginner",
        "target_muscles": "Hip Abductors, Outer Thighs",
        "instructions": "Extend leg laterally with a smooth squeeze at the peak of the motion."
    },
    {
        "id": "calf_raises",
        "name": "Calf Raises",
        "category": "Lower Body",
        "target": "15 reps",
        "target_reps": 15,
        "icon": "👣",
        "difficulty": "Beginner",
        "target_muscles": "Gastrocnemius, Soleus",
        "instructions": "Push through the balls of your feet to elevate heels, hold, and lower."
    },
    {
        "id": "sit_to_stand",
        "name": "Sit-to-Stand",
        "category": "Mobility",
        "target": "10 reps",
        "target_reps": 10,
        "icon": "🪑",
        "difficulty": "Beginner",
        "target_muscles": "Quadriceps, Glutes, Core",
        "instructions": "Rise from a chair to a full standing position without using arm support."
    },
    {
        "id": "leg_extension",
        "name": "Leg Extension",
        "category": "Mobility",
        "target": "12 reps",
        "target_reps": 12,
        "icon": "🦿",
        "difficulty": "Beginner",
        "target_muscles": "Quadriceps, Knee Stabilizers",
        "instructions": "While seated, extend lower leg forward until parallel to ground."
    },
    {
        "id": "neck_shoulder_mobility",
        "name": "Shoulder/Neck Mobility",
        "category": "Mobility",
        "target": "10 reps",
        "target_reps": 10,
        "icon": "🧘",
        "difficulty": "Beginner",
        "target_muscles": "Cervical Spine, Trapezius",
        "instructions": "Elevate shoulders straight up towards ears in a controlled shrug motion."
    }
]


def get_exercise(name: str, target_reps: int = None) -> BaseExercise:
    """Factory function to get an exercise detector instance by key/name."""
    clean_name = name.lower().replace(" ", "_").replace("-", "_").replace("/", "_")
    exercise_cls = EXERCISE_REGISTRY.get(clean_name, SquatExercise)
    if target_reps is not None:
        return exercise_cls(target_reps=target_reps)
    return exercise_cls()


def list_exercises() -> List[Dict]:
    """Returns list of supported exercise metadata."""
    return EXERCISES_METADATA
