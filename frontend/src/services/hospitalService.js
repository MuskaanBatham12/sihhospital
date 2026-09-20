import API from "./api";

export const getHospitals = async (params = {}) => {
  try {
    const response = await API.get("/hospitals", { params });
    return response.data;
  } catch (error) {
    console.warn("Backend /hospitals endpoint unreachable:", error.message);
    return null;
  }
};

export const getNearbyHospitals = async (lat, lng, radius = 50) => {
  try {
    const response = await API.get("/hospitals/nearby", {
      params: { lat, lng, radius },
    });
    return response.data;
  } catch (error) {
    console.warn("Backend /hospitals/nearby unreachable:", error.message);
    return null;
  }
};

export const getHospitalAvailability = async (hospitalId) => {
  try {
    const response = await API.get(`/hospitals/${hospitalId}/availability`);
    return response.data;
  } catch (error) {
    console.warn(`Backend availability for hospital ${hospitalId} unreachable:`, error.message);
    return null;
  }
};

export const getRecommendedHospitals = async (data) => {
  try {
    const response = await API.post("/allocation/rank", data);
    return response.data;
  } catch (error) {
    console.warn("Backend allocation rank unavailable:", error.message);
    return null;
  }
};

export const requestAllocation = async (data) => {
  try {
    const response = await API.post("/allocation/auto", data);
    return response.data;
  } catch (error) {
    console.warn("Backend auto allocation failed:", error.message);
    return null;
  }
};