const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const path = require("path");

const requestId = require("./middleware/requestId");
const preventPrototypePollution = require("./middleware/preventPrototypePollution");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiters");
const errorHandler = require("./middleware/errorHandler");

const app = express();

/* =========================================================
   BASIC APP CONFIGURATION
========================================================= */

app.disable("x-powered-by");

app.use(requestId);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(preventPrototypePollution);

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  console.warn(
    "⚠️ WARNING: CORS_ORIGIN is not set in production. The API is currently open to all origins!"
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as Postman, server-to-server requests, etc.
      if (!origin) {
        return callback(null, true);
      }

      // If no CORS_ORIGIN is configured,
      // allow the request.
      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }

      // Allow only configured origins.
      return callback(null, allowedOrigins.includes(origin));
    },

    credentials: false,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-registration-key",
    ],

    maxAge: 600,
  })
);

/* =========================================================
   BODY PARSING
========================================================= */

app.use(express.json({ limit: "100kb" }));

/* =========================================================
   UPLOADS
========================================================= */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

/* =========================================================
   API RATE LIMITING
========================================================= */

app.use("/api/v1", apiLimiter);

app.use("/api/v1/auth", authLimiter);

/* =========================================================
   BASIC API / HEALTH ROUTES
========================================================= */

app.get("/health", async (req, res) => {
  const prisma = require("./prisma/prismaClient");

  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check database error:", error);

    res.status(503).json({
      status: "error",
      database: "unreachable",
    });
  }
});

/* =========================================================
   SWAGGER API DOCUMENTATION
========================================================= */

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

/* =========================================================
   API ROUTES
========================================================= */

const routes = require("./routes");

app.use("/api/v1", routes);

/* =========================================================
   SERVE REACT FRONTEND
=========================================================

   Render runs the backend from:

   backend/

   The frontend production build is generated at:

   frontend/dist/

   Therefore we go two levels up from:

   backend/src/app.js

   and then into:

   frontend/dist
========================================================= */

const frontendPath = path.join(
  __dirname,
  "../../frontend/dist"
);

/*
   Serve React static files such as:

   /assets/...
   /favicon...
   /images/...
*/
app.use(express.static(frontendPath));

/* =========================================================
   REACT SPA FALLBACK
=========================================================

   React Router uses BrowserRouter.

   Therefore routes such as:

   /student-login
   /parent-login
   /teacher-login
   /student/dashboard

   must return index.html when directly opened.

   API routes are excluded so that unknown API requests
   still receive the JSON 404 response below.
========================================================= */

app.get("*", (req, res, next) => {
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/uploads/") ||
    req.path.startsWith("/api-docs")
  ) {
    return next();
  }

  res.sendFile(
    path.join(frontendPath, "index.html")
  );
});

/* =========================================================
   API 404 HANDLER
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    requestId: req.id,
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(errorHandler);

module.exports = app;