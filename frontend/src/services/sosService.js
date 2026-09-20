import API from "./api";

export const sendSOS = async (sosData) => {
  try {
    const response = await API.post("/sos/", null, {
      params: {
        patient_id: sosData.patient_id || 1,
        latitude: sosData.latitude,
        longitude: sosData.longitude,
        severity: (sosData.severity || "HIGH").toUpperCase(),
        required_resource: (sosData.required_resource || "GENERAL_BED").toUpperCase(),
      },
    });
    return response.data;
  } catch (error) {
    console.warn("Backend SOS endpoint returned error or offline:", error.message);
    return null;
  }
};