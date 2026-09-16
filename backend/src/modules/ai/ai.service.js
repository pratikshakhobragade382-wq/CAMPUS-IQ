const prisma = require("../../prisma/prismaClient");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

const SYSTEM_PROMPT = `
You are CampusIQ AI Teacher Co-Pilot, an intelligent teaching assistant
for school teachers.

Your job is to help teachers with:
- Creating question papers
- Creating MCQs
- Homework and assignments
- Lesson explanations
- Notes and study material
- Answer keys
- Classroom activities
- Educational planning
- Explaining uploaded images
- General academic questions

Always provide accurate, clear and practical answers.

When generating educational content:
- Keep it suitable for the requested class/grade.
- Use clear headings and bullet points when useful.
- For MCQs, provide options and clearly mention the correct answer.
- For question papers, organize questions properly.
- Do not unnecessarily mention that you are an AI.
- Keep the response professional and teacher-friendly.
`;

async function chatWithAI(
  message,
  image,
  conversationId,
  tenantId,
  userId
) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in backend .env");
  }

  if (!message && !image) {
    throw new Error("Message or image is required");
  }

  // ---------------------------------------------------------
  // GET PREVIOUS CHAT HISTORY
  // ---------------------------------------------------------

  let history = [];

  if (conversationId) {
    const messages = await prisma.aIMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 20,
    });

    history = messages;
  }

  // ---------------------------------------------------------
  // BUILD GEMINI INPUT
  // ---------------------------------------------------------

  const input = [];

  // Previous conversation
  for (const item of history) {
    if (!item.content) continue;

    input.push({
      type: item.role === "assistant" ? "text" : "text",
      text:
        item.role === "assistant"
          ? `Assistant: ${item.content}`
          : `User: ${item.content}`,
    });
  }

  // Current user message
  if (message) {
    input.push({
      type: "text",
      text: message,
    });
  }

  // Current image
  if (image) {
    input.push({
      type: "image",
      data: image.buffer.toString("base64"),
      mime_type: image.mimetype,
    });
  }

  // ---------------------------------------------------------
  // GEMINI INTERACTIONS API
  // ---------------------------------------------------------

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 120000);

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },

      body: JSON.stringify({
        model: GEMINI_MODEL,

        system_instruction: SYSTEM_PROMPT,

        input,

        store: false,
      }),

      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);

      const errorMessage =
        data?.error?.message ||
        data?.message ||
        "Gemini API request failed.";

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Gemini API authentication failed. Check your GEMINI_API_KEY."
        );
      }

      if (response.status === 429) {
        throw new Error(
          "Gemini API rate limit reached. Please wait a moment and try again."
        );
      }

      if (response.status === 400) {
        throw new Error(`Gemini API bad request: ${errorMessage}`);
      }

      throw new Error(`Gemini API error: ${errorMessage}`);
    }

    // ---------------------------------------------------------
    // EXTRACT TEXT FROM INTERACTION RESPONSE
    // ---------------------------------------------------------

    const steps = data?.steps || [];

    let reply = "";

    for (const step of steps) {
      if (step.type !== "model_output") continue;

      const content = step.content || [];

      for (const item of content) {
        if (item.type === "text" && item.text) {
          reply += item.text;
        }
      }
    }

    if (!reply.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    return reply.trim();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Gemini request timed out. Please try again."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  chatWithAI,
};