import API from "./api";

export const getVitals = async (patientId = 1) => {
  try {
    const response = await API.get(`/vitals/${patientId}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const saveVitals = async (vitalData) => {
  try {
    const response = await API.post("/vitals/", vitalData);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getHardwareTelemetry = async () => {
  try {
    const response = await API.get("/hardware/vitals/latest");
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getHardwareStatus = async () => {
  try {
    const response = await API.get("/hardware/status");
    return response.data;
  } catch (error) {
    return null;
  }
};