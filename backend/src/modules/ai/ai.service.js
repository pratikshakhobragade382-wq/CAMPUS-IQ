// =====================================================
// CAMPUSIQ LOCAL AI SERVICE
// =====================================================
// Uses Ollama + Qwen2.5-VL locally.
// No paid OpenAI API is used.
// =====================================================

const { HttpError } = require("../../utils/httpError");
const prisma = require("../../prisma/prismaClient");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_URL = `${OLLAMA_BASE_URL}/api/chat`;
const OLLAMA_TAGS_URL = `${OLLAMA_BASE_URL}/api/tags`;

// Priority list of models to use if present in Ollama
const PREFERRED_MODELS = [
  process.env.OLLAMA_MODEL,
  "qwen2.5vl:7b",
  "qwen2.5vl:3b",
  "qwen2.5-coder",
  "qwen2.5",
  "llama3.2-vision",
  "llama3.2",
].filter(Boolean);

let cachedModel = null;
let lastModelCheck = 0;

/**
 * Automatically detects which model is installed in the local Ollama instance.
 */
async function resolveOllamaModel() {
  const now = Date.now();
  if (cachedModel && now - lastModelCheck < 60000) {
    return cachedModel;
  }

  try {
    const res = await fetch(OLLAMA_TAGS_URL, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      const installedModels = (data.models || []).map((m) => m.name || m.model || "");

      // 1. If explicit env variable is set and present
      if (process.env.OLLAMA_MODEL && installedModels.some((n) => n.includes(process.env.OLLAMA_MODEL))) {
        cachedModel = process.env.OLLAMA_MODEL;
        lastModelCheck = now;
        return cachedModel;
      }

      // 2. Check preferred model list against installed models
      for (const pref of PREFERRED_MODELS) {
        const found = installedModels.find((n) => n === pref || n.startsWith(`${pref}:`) || n.includes(pref));
        if (found) {
          cachedModel = found;
          lastModelCheck = now;
          return cachedModel;
        }
      }

      // 3. Fallback to any installed model
      if (installedModels.length > 0) {
        cachedModel = installedModels[0];
        lastModelCheck = now;
        return cachedModel;
      }
    }
  } catch (err) {
    console.warn("Could not query Ollama tags:", err.message);
  }

  // Default fallback
  cachedModel = process.env.OLLAMA_MODEL || "qwen2.5vl:7b";
  lastModelCheck = now;
  return cachedModel;
}

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
    const activeModel = await resolveOllamaModel();
    console.log(`AI: Sending request to Ollama (${activeModel})...`);

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: activeModel,
        messages,
        stream: false,
        keep_alive: "30m",
        options: {
          num_predict: 512,
          temperature: 0.2,
          num_ctx: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI: Ollama request error (${response.status}):`, errorText);
      throw new HttpError(
        502,
        `Local AI error: ${errorText || response.statusText}. Please ensure model "${activeModel}" is downloaded.`,
        { code: "OLLAMA_ERROR", expose: true }
      );
    }

    const data = await response.json();

    const aiResponse =
      data?.message?.content?.trim() || "No response generated.";

    console.log("AI: Ollama response received successfully.");

    return aiResponse;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new HttpError(
        504,
        "The local AI model took too long to respond. Please try again.",
        { code: "AI_TIMEOUT", expose: true }
      );
    }

    if (
      error?.code === "ECONNREFUSED" ||
      error?.cause?.code === "ECONNREFUSED"
    ) {
      throw new HttpError(
        503,
        "Ollama is not running. Please start Ollama on your computer and try again.",
        { code: "OLLAMA_NOT_RUNNING", expose: true }
      );
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(
      500,
      error?.message || "Failed to generate AI response. Please ensure Ollama is running.",
      { code: "AI_GENERATION_FAILED", expose: true }
    );
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