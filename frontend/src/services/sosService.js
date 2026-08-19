import API from "./api";

export const sendSOS = async (sosData) => {
  const response = await API.post(
    "/sos",
    sosData
  );

  return response.data;
};