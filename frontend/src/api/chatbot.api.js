import api from "./axios";

export async function chatWithBot(message) {
  const response = await api.post("/chatbot", {
    message,
  });

  return response.data;
}