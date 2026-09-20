import { PhysioAPI } from "./api";

export const getPhysioStatus = async () => {
  try {
    const response = await PhysioAPI.get("/physio/status");
    return response.data;
  } catch (error) {
    console.warn("Physio backend offline, using client-side engine:", error.message);
    return { status: "offline", service: "Client-side MediaPipe Active" };
  }
};

export const getExercises = async () => {
  try {
    const response = await PhysioAPI.get("/physio/exercises");
    return response.data.exercises;
  } catch (error) {
    console.warn("Could not fetch remote exercises, fallback to local registry");
    return null;
  }
};

export const analyzePoseFrame = async (payload) => {
  try {
    const response = await PhysioAPI.post("/physio/analyze", payload);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const startPhysioSession = async (exerciseName, targetReps = 10) => {
  try {
    const response = await PhysioAPI.post("/physio/session/start", {
      exercise_name: exerciseName,
      target_reps: targetReps,
    });
    return response.data;
  } catch (error) {
    return { session_id: "local_session", exercise: exerciseName, target_reps: targetReps };
  }
};

export const endPhysioSession = async (sessionId = "default") => {
  try {
    const response = await PhysioAPI.post("/physio/session/end", { session_id: sessionId });
    return response.data;
  } catch (error) {
    return null;
  }
};
