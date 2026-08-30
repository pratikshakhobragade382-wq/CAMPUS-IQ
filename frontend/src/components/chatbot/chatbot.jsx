import { useState } from "react";
import { chatWithAI } from "../../api/ai.api";
import { STORAGE_KEYS } from "../../utils/constants";
import "./Chatbot.css";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Session expired. Please login again.",
        },
      ]);
      return;
    }

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMessage },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await chatWithAI(
        userMessage,
        null,
        conversationId
      );

      console.log("AI RESPONSE:", response);

      // Support both response.data.data and response.data formats
      const payload = response?.data?.data || response?.data || response || {};

      if (payload.conversationId) {
        setConversationId(payload.conversationId);
      }

      const reply =
        payload.reply ||
        payload.message ||
        payload.answer ||
        "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply,
        },
      ]);
    } catch (error) {
      console.error("AI CHAT ERROR:", error);

      let errorMessage = "Sorry, something went wrong. Please try again.";

      if (error.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        💬
      </button>

      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            Campus AI Teacher
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="bot">
                👋 Hello! How can I help you?
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={msg.sender}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className="bot">
                Thinking...
              </div>
            )}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask something..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
              disabled={loading}
            />

            <button
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}