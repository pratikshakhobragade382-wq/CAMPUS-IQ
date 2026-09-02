import { useState, useRef, useEffect } from "react";
import { chatWithBot } from "../../api/chatbot.api";
import { STORAGE_KEYS } from "../../utils/constants";
import "./Chatbot.css";

export default function Chatbot() {
  const CHAT_STORAGE_KEY = "campusiq_chat_history";

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getTime = () =>
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    speechSynthesis.speak(utterance);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const getFollowUps = (reply) => {
    const t = reply.toLowerCase();

    if (t.includes("attendance"))
      return ["Today's Timetable", "Next Class"];

    if (t.includes("timetable"))
      return ["Next Class", "Exams"];

    if (t.includes("exam"))
      return ["Holidays", "Today's Timetable"];

    if (t.includes("holiday"))
      return ["Exams", "Today's Timetable"];

    if (t.includes("fee"))
      return ["Attendance", "Today's Timetable"];

    return [];
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Session expired. Please login again.",
          time: getTime(),
        },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text,
        time: getTime(),
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await chatWithBot(text);

      const reply =
        response.reply ||
        response.message ||
        response.answer ||
        "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply,
          time: getTime(),
        },
      ]);
    } catch (error) {
      let errorMessage = "Sorry, something went wrong.";

      if (error.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorMessage,
          time: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "Attendance",
    "Today's Timetable",
    "Next Class",
    "Timetable",
    "Exams",
    "Holidays",
    "Fees",
  ];

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
            <span>CampusIQ Assistant</span>

            <div className="chat-header-actions">
              <button
                className="icon-btn"
                title="Clear Chat"
                onClick={() => {
                  setMessages([]);
                  localStorage.removeItem(CHAT_STORAGE_KEY);
                }}
              >
                🗑️
              </button>

              <button
                className="icon-btn"
                title="Close"
                onClick={() => setIsOpen(false)}
              >
                ✖
              </button>
            </div>
          </div>

          <div className="chat-messages">

            {messages.length === 0 && (
              <>
                <div className="welcome-card">
                  <div className="welcome-title">
                    👋 Welcome to CampusIQ
                  </div>

                  <div className="welcome-subtitle">
                    Ask about attendance, timetable, fees, exams and holidays.
                  </div>
                </div>

                <div className="quick-actions">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      className="quick-btn"
                      onClick={() => sendMessage(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender}`}
              >
                <div>{msg.text}</div>

                <span className="message-time">
                  {msg.time}
                </span>

                {msg.sender === "bot" && (
                  <>
                    <div className="message-actions">

                      <button
                        className="copy-btn"
                        onClick={() => copyText(msg.text)}
                      >
                        📋 Copy
                      </button>

                      <button
                        className="copy-btn"
                        onClick={() => speak(msg.text)}
                      >
                        🔊 Listen
                      </button>

                    </div>

                    <div className="feedback-actions">

                      <button className="feedback-btn">
                        👍
                      </button>

                      <button className="feedback-btn">
                        👎
                      </button>

                    </div>

                    {getFollowUps(msg.text).length > 0 && (
                      <div className="follow-up-actions">
                        {getFollowUps(msg.text).map((q) => (
                          <button
                            key={q}
                            className="follow-up-btn"
                            onClick={() => sendMessage(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {loading && (
              <div className="message bot typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef}></div>

          </div>

          <div className="chat-input">

            <textarea
              rows="1"
              placeholder="Ask something..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(message);
                }
              }}
            />

            <button
              onClick={() => sendMessage(message)}
              disabled={loading}
            >
              ➤
            </button>

          </div>

        </div>
      )}
    </>
  );
}