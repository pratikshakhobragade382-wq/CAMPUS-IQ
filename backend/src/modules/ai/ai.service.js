// =====================================================
// CAMPUSIQ LOCAL AI SERVICE
// =====================================================
// Uses Ollama + Qwen2.5-VL locally.
// No paid OpenAI API is used.
// =====================================================

const prisma = require("../../prisma/prismaClient");

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL_NAME = "qwen2.5vl:7b";

// =====================================================
// CAMPUSIQ AI SYSTEM PROMPT
// =====================================================

const SYSTEM_PROMPT = `
You are CampusIQ AI Teacher Co-Pilot.

You are an intelligent teaching assistant for school teachers.

Help teachers with:
- Question papers
- MCQs
- Homework
- Lesson explanations
- Teaching ideas
- Educational content
- Image and document analysis

Keep responses clear, structured and suitable for school education.

When generating educational content, consider the class,
subject, topic and difficulty mentioned by the teacher.

When an image is provided:
- Carefully analyze the image.
- Identify relevant text, questions, diagrams or educational content.
- Do not invent information that is not visible in the image.
- If something is unclear, say so.

Use the previous conversation messages as context.
Maintain continuity when the teacher asks follow-up questions.

Do not unnecessarily make responses very long.

Always be helpful, accurate and teacher-friendly.
`;

// =====================================================
// AI CHAT SERVICE
// =====================================================

async function chatWithAI(
  message,
  image = null,
  conversationId = null,
  tenantId = null,
  userId = null
) {
  if ((!message || !message.trim()) && !image) {
    throw new Error("Message or image is required");
  }

  // ---------------------------------------------------
  // LOAD PREVIOUS CONVERSATION
  // ---------------------------------------------------

  let previousMessages = [];

  if (conversationId && tenantId && userId) {
    previousMessages = await prisma.aIMessage.findMany({
      where: {
        conversationId: Number(conversationId),
        tenantId,
        userId,
      },

      orderBy: {
        createdAt: "asc",
      },

      // Prevent sending an unnecessarily huge history
      // to the local model.
      take: 30,

      select: {
        role: true,
        content: true,
      },
    });
  }

  // ---------------------------------------------------
  // BUILD OLLAMA MESSAGES
  // ---------------------------------------------------

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];

  // Add previous conversation messages.
  for (const previousMessage of previousMessages) {
    // Ollama accepts user/assistant roles.
    if (
      previousMessage.role === "user" ||
      previousMessage.role === "assistant"
    ) {
      messages.push({
        role: previousMessage.role,
        content: previousMessage.content,
      });
    }
  }

  // ---------------------------------------------------
  // CURRENT USER MESSAGE
  // ---------------------------------------------------

  const userMessage = {
    role: "user",
    content:
      message?.trim() || "Please analyze this image.",
  };

  // ---------------------------------------------------
  // ADD IMAGE
  // ---------------------------------------------------

  if (image) {
    userMessage.images = [
      image.buffer.toString("base64"),
    ];
  }

  messages.push(userMessage);

  // ---------------------------------------------------
  // SEND REQUEST TO OLLAMA
  // ---------------------------------------------------

  const response = await fetch(OLLAMA_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      model: MODEL_NAME,
      messages,
      stream: false,
    }),
  });

  // ---------------------------------------------------
  // HANDLE OLLAMA ERRORS
  // ---------------------------------------------------

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ollama request failed: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  // ---------------------------------------------------
  // RETURN AI RESPONSE
  // ---------------------------------------------------

  return (
    data.message?.content ||
    "No response generated."
  );
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  chatWithAI,
};