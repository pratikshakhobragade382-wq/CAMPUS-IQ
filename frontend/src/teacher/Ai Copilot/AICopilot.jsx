import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  User,
  Paperclip,
  X,
  Image as ImageIcon,
  Plus,
  MessageSquare,
  History,
} from "lucide-react";

import {
  chatWithAI,
  getAIConversations,
  getAIConversation,
} from "../../api/ai.api";

import "./AICopilot.css";

export default function AICopilot() {
  // =====================================================
  // STATE
  // =====================================================

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "ai",
      content:
        "Hello! I'm your AI Teacher Co-Pilot. Tell me what you would like to create or learn.",
    },
  ]);

  const [conversationId, setConversationId] = useState(null);

  const [conversations, setConversations] = useState([]);

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(false);

  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);

  // =====================================================
  // LOAD CONVERSATION HISTORY
  // =====================================================

  useEffect(() => {
    loadConversationHistory();
  }, []);

  async function loadConversationHistory() {
    try {
      setHistoryLoading(true);

      const result = await getAIConversations();

      const history = result?.data || [];

      setConversations(history);
    } catch (error) {
      console.error("AI HISTORY LOAD ERROR:", error);
    } finally {
      setHistoryLoading(false);
    }
  }

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // =====================================================
  // IMAGE SELECTION
  // =====================================================

  function handleImageSelect(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPG, PNG, WEBP or GIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10 MB.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);

    event.target.value = "";
  }

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  function handleRemoveImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview(null);
  }

  // =====================================================
  // OPEN FILE PICKER
  // =====================================================

  function handleAttachmentClick() {
    if (loading) {
      return;
    }

    fileInputRef.current?.click();
  }

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  async function handleSendMessage(event) {
    event?.preventDefault();

    const trimmedMessage = message.trim();

    if ((!trimmedMessage && !selectedImage) || loading) {
      return;
    }

    const imageUrl = imagePreview;

    const teacherMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content:
        trimmedMessage || "Please analyze this image.",
      image: imageUrl || null,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      teacherMessage,
    ]);

    const imageToSend = selectedImage;

    setMessage("");

    setSelectedImage(null);
    setImagePreview(null);

    setLoading(true);

    try {
      // =================================================
      // SEND TO EXISTING OR NEW CONVERSATION
      // =================================================

      const result = await chatWithAI(
        trimmedMessage,
        imageToSend,
        conversationId
      );

      const newConversationId =
        result?.data?.conversationId;

      const aiReply =
        result?.data?.reply ||
        result?.reply ||
        "I couldn't generate a response.";

      // =================================================
      // SAVE CONVERSATION ID
      // =================================================

      if (newConversationId) {
        setConversationId(newConversationId);
      }

      // =================================================
      // ADD AI RESPONSE
      // =================================================

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: aiReply,
        },
      ]);

      // =================================================
      // REFRESH HISTORY
      // =================================================

      await loadConversationHistory();
    } catch (error) {
      console.error("AI CHAT ERROR:", error);

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `error-${Date.now()}`,
          role: "ai",
          content:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Sorry, I couldn't connect to the AI service. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // OPEN EXISTING CONVERSATION
  // =====================================================

  async function handleOpenConversation(id) {
    if (loading || historyLoading) {
      return;
    }

    try {
      setHistoryLoading(true);

      const result = await getAIConversation(id);

      const conversation = result?.data;

      if (!conversation) {
        return;
      }

      setConversationId(conversation.id);

      const loadedMessages =
        (conversation.messages || []).map((item) => ({
          id: item.id,
          role:
            item.role === "assistant"
              ? "ai"
              : "user",
          content: item.content || "",
          image: item.imageUrl || null,
        }));

      setMessages(
        loadedMessages.length
          ? loadedMessages
          : [
              {
                id: "empty",
                role: "ai",
                content:
                  "This conversation does not contain any messages yet.",
              },
            ]
      );

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setSelectedImage(null);
      setImagePreview(null);
      setMessage("");
    } catch (error) {
      console.error(
        "OPEN AI CONVERSATION ERROR:",
        error
      );

      alert("Unable to open this conversation.");
    } finally {
      setHistoryLoading(false);
    }
  }

  // =====================================================
  // NEW CHAT
  // =====================================================

  function handleNewChat() {
    if (loading) {
      return;
    }

    setConversationId(null);

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "ai",
        content:
          "Hello! I'm your AI Teacher Co-Pilot. Tell me what you would like to create or learn.",
      },
    ]);

    setMessage("");

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview(null);
  }

  // =====================================================
  // ENTER KEY
  // =====================================================

  function handleInputKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        (message.trim() || selectedImage) &&
        !loading
      ) {
        handleSendMessage(event);
      }
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="ai-copilot-page">

      {/* =================================================
          TOP HEADER
          ================================================= */}

      <header className="ai-copilot-topbar">

        <div className="ai-topbar-title">

          <div className="ai-topbar-icon">
            <Bot size={22} />
          </div>

          <div>
            <h1>AI Teacher Co-Pilot</h1>
            <span>
              Your intelligent teaching assistant
            </span>
          </div>

        </div>

        <button
          type="button"
          className="ai-topbar-new-chat"
          onClick={handleNewChat}
          disabled={loading}
        >
          <Plus size={17} />
          <span>New Chat</span>
        </button>

      </header>

      {/* =================================================
          MAIN WORKSPACE
          ================================================= */}

      <div className="ai-copilot-workspace">

        {/* =================================================
            LEFT SIDEBAR
            ================================================= */}

        <aside className="ai-history-sidebar">

          {/* SIDEBAR HEADER */}

          <div className="ai-history-sidebar-header">

            <div className="ai-history-heading">

              <History size={17} />

              <span>Chat History</span>

            </div>

            <button
              type="button"
              className="ai-sidebar-new-chat"
              onClick={handleNewChat}
              disabled={loading}
              title="New Chat"
            >
              <Plus size={17} />
            </button>

          </div>

          {/* NEW CHAT */}

          <button
            type="button"
            className="ai-history-new-chat"
            onClick={handleNewChat}
            disabled={loading}
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>

          {/* HISTORY */}

          <div className="ai-history-content">

            {historyLoading && conversations.length === 0 ? (
              <div className="ai-history-loading">
                Loading chats...
              </div>
            ) : conversations.length === 0 ? (
              <div className="ai-history-empty">

                <MessageSquare size={24} />

                <p>No conversations yet.</p>

                <span>
                  Your saved chats will appear here.
                </span>

              </div>
            ) : (
              <>
                <div className="ai-history-section-title">
                  Today
                </div>

                <div className="ai-history-list">

                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      className={
                        conversation.id ===
                        conversationId
                          ? "ai-history-item active"
                          : "ai-history-item"
                      }
                      onClick={() =>
                        handleOpenConversation(
                          conversation.id
                        )
                      }
                      disabled={
                        loading ||
                        historyLoading
                      }
                      title={conversation.title}
                    >

                      <div className="ai-history-item-icon">
                        <MessageSquare size={15} />
                      </div>

                      <div className="ai-history-item-content">

                        <span className="ai-history-item-title">
                          {conversation.title ||
                            "Untitled Conversation"}
                        </span>

                        <span className="ai-history-item-meta">
                          Conversation
                        </span>

                      </div>

                    </button>
                  ))}

                </div>
              </>
            )}

          </div>

        </aside>

        {/* =================================================
            RIGHT CHAT PANEL
            ================================================= */}

        <main className="ai-chat-panel">

          {/* CHAT HEADER */}

          <div className="ai-chat-header">

            <div className="ai-chat-header-left">

              <div className="ai-chat-avatar">
                <Bot size={19} />
              </div>

              <div className="ai-chat-title">

                <strong>AI Co-Pilot</strong>

                <span>
                  Your CampusIQ teaching assistant
                </span>

              </div>

            </div>

            <div className="ai-chat-status">

              <span className="ai-status-dot"></span>

              Ready

            </div>

          </div>

          {/* MESSAGES */}

          <div className="ai-copilot-messages">

            {messages.map((chatMessage) => {

              const isAI =
                chatMessage.role === "ai";

              return (
                <div
                  key={chatMessage.id}
                  className={
                    isAI
                      ? "ai-message assistant"
                      : "ai-message user"
                  }
                >

                  {/* AI AVATAR */}

                  {isAI && (
                    <div className="ai-message-avatar assistant-avatar">
                      <Bot size={17} />
                    </div>
                  )}

                  {/* MESSAGE */}

                  <div className="ai-message-body">

                    <div className="ai-message-name">
                      {isAI
                        ? "AI Co-Pilot"
                        : "You"}
                    </div>

                    {/* IMAGE */}

                    {chatMessage.image && (
                      <div className="ai-message-image-wrapper">

                        <img
                          src={chatMessage.image}
                          alt="Attached"
                          className="ai-message-image"
                        />

                      </div>
                    )}

                    {/* TEXT */}

                    {chatMessage.content && (
                      <div className="ai-message-content">
                        {chatMessage.content}
                      </div>
                    )}

                  </div>

                  {/* USER AVATAR */}

                  {!isAI && (
                    <div className="ai-message-avatar user-avatar">
                      <User size={17} />
                    </div>
                  )}

                </div>
              );
            })}

            {/* THINKING */}

            {loading && (
              <div className="ai-message assistant">

                <div className="ai-message-avatar assistant-avatar">
                  <Bot size={17} />
                </div>

                <div className="ai-message-body">

                  <div className="ai-message-name">
                    AI Co-Pilot
                  </div>

                  <div className="ai-thinking">

                    <span></span>
                    <span></span>
                    <span></span>

                    <label>Thinking...</label>

                  </div>

                </div>

              </div>
            )}

            <div ref={messagesEndRef} />

          </div>

          {/* =================================================
              INPUT
              ================================================= */}

          <div className="ai-copilot-input-area">

            {/* IMAGE PREVIEW */}

            {imagePreview && (
              <div className="ai-selected-image">

                <div className="ai-selected-image-preview">

                  <img
                    src={imagePreview}
                    alt="Selected preview"
                  />

                  <button
                    type="button"
                    className="ai-remove-image"
                    onClick={handleRemoveImage}
                    aria-label="Remove image"
                    disabled={loading}
                  >
                    <X size={14} />
                  </button>

                </div>

                <div className="ai-selected-image-info">

                  <ImageIcon size={15} />

                  <span>
                    {selectedImage?.name ||
                      "Image attached"}
                  </span>

                </div>

              </div>
            )}

            {/* INPUT FORM */}

            <form
              className="ai-copilot-input-wrapper"
              onSubmit={handleSendMessage}
            >

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                className="ai-hidden-file-input"
              />

              {/* ATTACH */}

              <button
                type="button"
                className="ai-attachment-button"
                onClick={handleAttachmentClick}
                disabled={loading}
                aria-label="Attach image"
                title="Attach image"
              >
                <Paperclip size={20} />
              </button>

              {/* TEXT */}

              <input
                type="text"
                className="ai-copilot-input"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleInputKeyDown}
                placeholder="Ask your AI Teacher Co-Pilot..."
                disabled={loading}
              />

              {/* SEND */}

              <button
                type="submit"
                className="ai-copilot-send"
                disabled={
                  (!message.trim() &&
                    !selectedImage) ||
                  loading
                }
                aria-label="Send message"
                title="Send"
              >
                <Send size={18} />
              </button>

            </form>

            {/* HINT */}

            <div className="ai-input-hint">

              <span>
                📎 Attach an image for AI analysis
              </span>

              <span>
                Press Enter to send
              </span>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}