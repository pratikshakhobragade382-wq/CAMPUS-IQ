import api from "./axios";

/**
 * =====================================================
 * CAMPUS IQ
 * AI TEACHER CO-PILOT API
 * =====================================================
 *
 * Supports:
 * - Text-only AI questions
 * - Image-only analysis
 * - Text + image analysis
 * - Existing conversation
 * - Conversation history
 * - Opening a previous conversation
 *
 * Backend:
 * POST /api/v1/ai/chat
 * GET  /api/v1/ai/conversations
 * GET  /api/v1/ai/conversations/:id
 *
 * AI:
 * Ollama + Qwen2.5-VL 7B
 */

/**
 * =====================================================
 * SEND MESSAGE TO AI
 * =====================================================
 *
 * conversationId is optional.
 *
 * If conversationId is NOT provided:
 * → Backend creates a new conversation.
 *
 * If conversationId IS provided:
 * → Backend continues that conversation.
 */
export async function chatWithAI(
  message = "",
  image = null,
  conversationId = null
) {
  const formData = new FormData();

  // ===================================================
  // MESSAGE
  // ===================================================

  if (message && message.trim()) {
    formData.append(
      "message",
      message.trim()
    );
  }

  // ===================================================
  // CONVERSATION ID
  // ===================================================

  if (conversationId) {
    formData.append(
      "conversationId",
      String(conversationId)
    );
  }

  // ===================================================
  // IMAGE
  // ===================================================

  if (image) {
    formData.append(
      "image",
      image
    );
  }

  // ===================================================
  // REQUEST
  // ===================================================

  const response = await api.post(
    "/ai/chat",
    formData,
    {
      // Qwen2.5-VL can take some time on CPU.
      timeout: 120000,

      // Do NOT manually set Content-Type.
      //
      // Axios automatically creates:
      // multipart/form-data
      // with the correct boundary.
    }
  );

  return response.data;
}


/**
 * =====================================================
 * GET ALL AI CONVERSATIONS
 * =====================================================
 *
 * Returns conversations belonging only to
 * the authenticated teacher.
 */
export async function getAIConversations() {
  const response = await api.get(
    "/ai/conversations"
  );

  return response.data;
}


/**
 * =====================================================
 * GET ONE AI CONVERSATION
 * =====================================================
 *
 * Returns:
 * - conversation details
 * - complete saved messages
 */
export async function getAIConversation(
  conversationId
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required"
    );
  }

  const response = await api.get(
    `/ai/conversations/${conversationId}`
  );

  return response.data;
}