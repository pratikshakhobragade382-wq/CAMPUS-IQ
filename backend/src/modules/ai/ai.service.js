
const prisma = require("../../prisma/prismaClient");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

// Try the configured model first, then use alternatives for temporary outages.
const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
];

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

// Retry only temporary service errors.
function isTemporaryError(status) {
  return [429, 500, 502, 503, 504].includes(status);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestGemini(model, input, signal) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      model,
      system_instruction: SYSTEM_PROMPT,
      input,
      store: false,
    }),
    signal,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        data?.message ||
        "Gemini API request failed."
    );

    error.status = response.status;
    throw error;
  }

  const steps = data?.steps || [];
  let reply = "";

  for (const step of steps) {
    if (step.type !== "model_output") continue;

    for (const item of step.content || []) {
      if (item.type === "text" && item.text) {
        reply += item.text;
      }
    }
  }

  if (!reply.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return reply.trim();
}

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

  // Get previous conversation messages.
  let history = [];

  if (conversationId) {
    history = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
  }

  // Prepare the input for Gemini.
  const input = [];

  for (const item of history) {
    if (!item.content) continue;

    input.push({
      type: "text",
      text:
        item.role === "assistant"
          ? `Assistant: ${item.content}`
          : `User: ${item.content}`,
    });
  }

  if (message) {
    input.push({
      type: "text",
      text: message,
    });
  }

  if (image) {
    input.push({
      type: "image",
      data: image.buffer.toString("base64"),
      mime_type: image.mimetype,
    });
  }

  // Try each model, with one retry for temporary service errors.
  const models = [
    ...new Set([GEMINI_MODEL, ...FALLBACK_MODELS]),
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    let lastError;

    for (const model of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const reply = await requestGemini(
            model,
            input,
            controller.signal
          );

          if (model !== GEMINI_MODEL) {
            console.log(`Gemini fallback succeeded: ${model}`);
          }

          return reply;
        } catch (error) {
          if (error.name === "AbortError") {
            throw new Error(
              "Gemini request timed out. Please try again."
            );
          }

          lastError = error;

          console.error("Gemini request failed:", {
            model,
            attempt,
            status: error.status,
            message: error.message,
          });

          // Authentication and invalid-request errors should not
          // trigger retries or model fallbacks.
          if (
            error.status &&
            !isTemporaryError(error.status)
          ) {
            throw error;
          }

          // Retry temporary errors once before trying another model.
          if (
            error.status &&
            isTemporaryError(error.status) &&
            attempt < 2
          ) {
            await wait(800);
            continue;
          }

          // Unknown network errors get one retry too.
          if (!error.status && attempt < 2) {
            await wait(800);
            continue;
          }

          break;
        }
      }
    }

    throw new Error(
      `All Gemini models failed. Last error: ${
        lastError?.message || "Unknown error"
      }`
    );
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  chatWithAI,
};