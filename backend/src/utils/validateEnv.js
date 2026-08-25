// utils/validateEnv.js
//
// Fails fast, with a clear message, if required configuration is missing.
// Better to crash at boot with "JWT_SECRET is missing" than to crash later,
// mid-request, in front of a real user, or silently run insecurely.

function validateEnv() {
  const errors = [];
  const isProduction = process.env.NODE_ENV === "production";

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is not set. The app cannot connect to Postgres without it.");
  }

  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is not set. Authentication cannot work without it.");
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push(
      "JWT_SECRET is too short (must be at least 32 characters). Generate one with: " +
        "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }

  if (isProduction && !process.env.CORS_ORIGIN) {
    // Not fatal — app.js already warns and falls back to allow-all — but call it
    // out clearly at boot too, since an open CORS policy in production is a real risk.
    console.warn(
      "⚠️  CORS_ORIGIN is not set in production. The API will accept requests from ANY origin."
    );
  }

  if (isProduction && !process.env.REGISTRATION_KEY) {
    console.warn(
      "⚠️  REGISTRATION_KEY is not set in production. Registration endpoints may be unprotected."
    );
  }

  if (errors.length > 0) {
    console.error("\n❌ Cannot start: missing/invalid required environment variables:\n");
    for (const err of errors) console.error("   - " + err);
    console.error("\nSet these in your hosting provider's environment settings (or your local .env file) and restart.\n");
    process.exit(1);
  }
}

module.exports = { validateEnv };
