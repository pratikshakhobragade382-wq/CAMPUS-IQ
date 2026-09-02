const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const requestId = require('./middleware/requestId');
const preventPrototypePollution = require('./middleware/preventPrototypePollution');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// MIDDLEWARES
app.disable('x-powered-by');

app.use(requestId);

// Adds common security headers (OWASP secure headers).
// NOTE: We disable CSP here to avoid breaking Swagger UI (it relies on inline scripts/styles).
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Prevent prototype pollution via JSON/query payloads.
app.use(preventPrototypePollution);

// CORS: allow all origins by default (backwards-compatible), but support a strict allow-list via CORS_ORIGIN.
// Example: CORS_ORIGIN="https://app.example.com,https://admin.example.com"
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.warn('⚠️ WARNING: CORS_ORIGIN is not set in production. The API is currently open to all origins!');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl/mobile apps) that may not send an Origin header.
      if (!origin) return callback(null, true);

      // If not configured, allow all origins (dev-friendly).
      if (allowedOrigins.length === 0) return callback(null, true);

      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: false, // If you move auth to cookies, reassess this + add CSRF protection.
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-registration-key'],
    maxAge: 600,
  })
);

// Body size limits reduce DoS risk from giant JSON payloads.
app.use(express.json({ limit: '100kb' }));

// Rate limiting mitigates brute-force and basic DoS.
app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authLimiter);

// ROOT ROUTE
app.get("/", (req, res) => {
  res.send("API Running");
});

// HEALTH CHECK — used by hosting platforms (Render/Railway/etc.) and uptime
// monitors. Also verifies the database is actually reachable, since "the
// server is up" and "the database is live" are two different failure modes.
app.get("/health", async (req, res) => {
  const prisma = require("./prisma/prismaClient");
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

// SWAGGER ROUTE
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ IMPORT ROUTES
const routes = require("./routes");

// ✅ USE ROUTES (VERY IMPORTANT)
app.use("/api/v1", routes);

// 404 handler (keeps errors consistent and avoids leaking Express defaults)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    requestId: req.id,
  });
});

// Centralized error handler (MUST be last)
app.use(errorHandler);

module.exports = app;