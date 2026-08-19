import API from "./api";

export const getVitals = async (patientId) => {
  const response = await API.get(
    `/vitals/${patientId}`
  );

  return response.data;
};

export const saveVitals = async (vitalData) => {
  const response = await API.post(
    "/vitals",
    vitalData
  );

  return response.data;
};