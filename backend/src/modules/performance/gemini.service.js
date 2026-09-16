const { GoogleGenAI } = require("@google/genai");

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.6-flash";

let client = null;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return client;
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

function buildFallbackInsights(data) {
  const prediction = cleanNumber(
    data?.prediction?.score ??
      data?.prediction?.value ??
      data?.predictedScore
  );

  const attendance = cleanNumber(
    data?.attendance?.percentage ??
      data?.metrics?.attendancePercentage
  );

  const assignments = cleanNumber(
    data?.metrics?.assignmentCompletion ??
      data?.assignments?.completionPercentage
  );

  const subjects = Array.isArray(data?.subjects)
    ? data.subjects
    : [];

  const strengths = [];
  const focusAreas = [];
  const recommendations = [];

  if (attendance >= 90) {
    strengths.push(
      "Attendance is strong and supports consistent learning."
    );
  } else if (attendance > 0 && attendance < 75) {
    focusAreas.push(
      "Attendance needs attention because regular participation supports academic progress."
    );

    recommendations.push(
      "Try to maintain more consistent attendance."
    );
  }

  if (assignments >= 85) {
    strengths.push(
      "Assignment completion is consistent."
    );
  } else if (assignments > 0 && assignments < 70) {
    focusAreas.push(
      "Assignment completion can be improved."
    );

    recommendations.push(
      "Complete assignments regularly and avoid missing deadlines."
    );
  }

  const sortedSubjects = [...subjects]
    .map((subject) => ({
      ...subject,
      score: cleanNumber(
        subject?.score ??
          subject?.average ??
          subject?.percentage
      ),
    }))
    .filter((subject) => subject.score > 0)
    .sort((a, b) => b.score - a.score);

  if (sortedSubjects.length > 0) {
    const strongest = sortedSubjects[0];

    strengths.push(
      `${strongest.name || "A subject"} is currently a strong area with a score of ${Math.round(
        strongest.score
      )}%.`
    );

    const weakest =
      sortedSubjects[sortedSubjects.length - 1];

    if (
      weakest &&
      weakest.name &&
      weakest.score < 70
    ) {
      focusAreas.push(
        `${weakest.name} may benefit from additional practice.`
      );

      recommendations.push(
        `Give additional practice time to ${weakest.name}.`
      );
    }
  }

  if (prediction >= 80) {
    recommendations.push(
      "Continue the current study routine and maintain consistency."
    );
  } else if (prediction >= 60) {
    recommendations.push(
      "Focus on weaker subjects while maintaining the areas that are already performing well."
    );
  } else if (prediction > 0) {
    recommendations.push(
      "A structured study routine and regular academic support may help improve progress."
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "The available academic information is being reviewed."
    );
  }

  if (focusAreas.length === 0) {
    focusAreas.push(
      "Continue monitoring academic progress across subjects."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Continue regular study, attendance and assignment habits."
    );
  }

  let summary;

  if (prediction >= 80) {
    summary =
      "The available academic indicators show a positive overall performance outlook.";
  } else if (prediction >= 60) {
    summary =
      "The student is making progress, with some areas that could benefit from additional attention.";
  } else {
    summary =
      "The available indicators suggest that additional academic support and regular monitoring may be helpful.";
  }

  return {
    summary,
    strengths: strengths.slice(0, 4),
    focusAreas: focusAreas.slice(0, 4),
    recommendations: recommendations.slice(0, 5),
    parentMessage:
      "Use these insights as a guide for supporting the student's learning journey.",
    source: "fallback",
  };
}

async function generatePerformanceInsights(tracker) {
  const ai = getGeminiClient();

  if (!ai) {
    console.warn(
      "GEMINI_API_KEY is not configured. Using local performance insights."
    );

    return buildFallbackInsights(tracker);
  }

  const safePayload = {
    student: {
      name:
        tracker?.student?.name ||
        tracker?.student?.studentName ||
        "Student",
      class:
        tracker?.student?.class?.name ||
        tracker?.student?.className ||
        "",
      section:
        tracker?.student?.section?.name ||
        tracker?.student?.sectionName ||
        "",
    },

    academicYear:
      tracker?.academicYear?.name ||
      tracker?.academicYear?.label ||
      "",

    prediction: {
      score:
        tracker?.prediction?.score ??
        tracker?.prediction?.value ??
        tracker?.predictedScore ??
        null,

      category:
        tracker?.prediction?.category ||
        tracker?.prediction?.label ||
        "",
    },

    metrics: tracker?.metrics || {},

    attendance: tracker?.attendance || {},

    trend: tracker?.trend || {},

    subjects: Array.isArray(tracker?.subjects)
      ? tracker.subjects
      : [],
  };

  const prompt = `
You are the academic-support assistant inside a school management system.

Your task is to analyze the provided student's academic indicators and produce
a short, supportive explanation for the student's parent.

IMPORTANT RULES:

1. Do not mention machine learning.
2. Do not mention Random Forest.
3. Do not mention Gemini.
4. Do not mention algorithms, models, APIs, datasets or technical implementation.
5. Do not invent marks or statistics.
6. Use only the information provided.
7. Do not make medical or psychological claims.
8. Do not make irreversible judgments about the student.
9. Keep the tone professional, encouraging and parent-friendly.
10. Recommendations should be practical and educational.

Return JSON matching the provided schema.

Student information:

${JSON.stringify(safePayload, null, 2)}
`;

  try {
    const interaction = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: prompt,

      response_format: {
        type: "text",
        mime_type: "application/json",

        schema: {
          type: "object",

          properties: {
            summary: {
              type: "string",
            },

            strengths: {
              type: "array",
              items: {
                type: "string",
              },
            },

            focusAreas: {
              type: "array",
              items: {
                type: "string",
              },
            },

            recommendations: {
              type: "array",
              items: {
                type: "string",
              },
            },

            parentMessage: {
              type: "string",
            },
          },

          required: [
            "summary",
            "strengths",
            "focusAreas",
            "recommendations",
            "parentMessage",
          ],
        },
      },
    });

    const raw =
      interaction?.output_text ||
      interaction?.outputs?.at(-1)?.text ||
      "";

    if (!raw) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error(
        "Gemini JSON parsing error:",
        parseError
      );

      throw parseError;
    }

    return {
      summary:
        parsed.summary ||
        buildFallbackInsights(tracker).summary,

      strengths:
        Array.isArray(parsed.strengths)
          ? parsed.strengths
          : [],

      focusAreas:
        Array.isArray(parsed.focusAreas)
          ? parsed.focusAreas
          : [],

      recommendations:
        Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],

      parentMessage:
        parsed.parentMessage ||
        "Continue supporting consistent learning habits.",

      source: "gemini",
    };
  } catch (error) {
    console.error(
      "Gemini performance insights failed:",
      error?.message || error
    );

    return buildFallbackInsights(tracker);
  }
}

module.exports = {
  generatePerformanceInsights,
};