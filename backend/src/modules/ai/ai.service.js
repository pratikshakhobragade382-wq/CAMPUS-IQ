// =====================================================
// CAMPUSIQ LOCAL AI SERVICE
// =====================================================
// Uses Ollama + Qwen2.5-VL locally.
// No paid OpenAI API is used.
// =====================================================

const prisma = require("../../prisma/prismaClient");

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL_NAME = "qwen2.5:3b";

// =====================================================
// OLLAMA TIMEOUT
// =====================================================

const OLLAMA_TIMEOUT = 5 * 60 * 1000;

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

Use previous conversation as context.
Maintain continuity for follow-up questions.

Keep answers concise unless the teacher asks for detail.
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
      take: 10,
      select: {
        role: true,
        content: true,
      },
    });
  }

  // ---------------------------------------------------
  // BUILD OLLAMA MESSAGE ARRAY
  // ---------------------------------------------------

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];

  for (const msg of previousMessages) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  const userMessage = {
    role: "user",
    content: message?.trim() || "Please analyze this image.",
  };

  if (image) {
    userMessage.images = [image.buffer.toString("base64")];
  }

  messages.push(userMessage);

  // ---------------------------------------------------
  // TIMEOUT CONTROLLER
  // ---------------------------------------------------

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, OLLAMA_TIMEOUT);

  try {
    console.log(`AI: Sending request to Ollama (${MODEL_NAME})...`);

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL_NAME,
        messages,
        stream: false,
        keep_alive: "30m",
        options: {
          num_predict: 80,
          temperature: 0.2,
          num_ctx: 1024,
          num_gpu: 0,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama request failed: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    const aiResponse =
      data?.message?.content?.trim() || "No response generated.";

    console.log("AI: Ollama response received.");

    return aiResponse;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "The local AI model took too long to respond. Please try again."
      );
    }

    if (
      error?.code === "ECONNREFUSED" ||
      error?.cause?.code === "ECONNREFUSED"
    ) {
      throw new Error(
        "Ollama is not running. Please start Ollama and try again."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  chatWithAI,
};