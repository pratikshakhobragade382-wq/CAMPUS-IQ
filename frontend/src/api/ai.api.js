import api from "./axios";

/**
 * =====================================================
 * CAMPUS IQ
 * AI TEACHER CO-PILOT API
 * =====================================================
 */

export async function chatWithAI(
  message = "",
  image = null,
  conversationId = null
) {
  const formData = new FormData();

  if (message && message.trim()) {
    formData.append("message", message.trim());
  }

  if (conversationId) {
    formData.append("conversationId", String(conversationId));
  }

  if (image) {
    formData.append("image", image);
  }

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

  const response = await api.post("/ai/chat", formData, {
    timeout: 120000,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  // Backend returns:
  // { success: true, data: { conversationId, reply } }
  return response.data.data;
}

export async function getAIConversations() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

  const response = await api.get("/ai/conversations", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  return response.data.data;
}

export async function getAIConversation(conversationId) {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

  const response = await api.get(`/ai/conversations/${conversationId}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  return response.data.data;
}