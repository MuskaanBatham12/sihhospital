import API from "./api";

export const getHospitals = async () => {
  const response = await API.get("/hospitals");

  return response.data;
};

export const getRecommendedHospitals = async (data) => {
  const response = await API.post(
    "/hospitals/recommended",
    data
  );

  return response.data;
};