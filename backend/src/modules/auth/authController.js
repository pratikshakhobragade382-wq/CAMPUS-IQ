// controllers/authController.js

const authService = require("./authService");
const prisma = require("../../prisma/prismaClient");

/**
 * Resolves the tenantId from the incoming request's subdomain.
 * Example:
 *   school1.dpinfosystem.in → Tenant where subdomain = "school1"
 *
 * Falls back to req.body.tenantId for local development / API testing.
 */
async function resolveTenantId(req) {
  // --- Production: resolve from subdomain ---
  const host = req.headers.host || "";
  const parts = host.split(".");

  // A real subdomain has at least 3 parts: [subdomain, domain, tld]
  if (parts.length >= 3) {
    const subdomain = parts[0];

    const tenant = await prisma.tenant.findFirst({
      where: { subdomain },
      select: { id: true },
    });

    if (tenant) return tenant.id;
  }

  // --- Development fallback ---
  if (req.body.tenantId) {
    return Number(req.body.tenantId);
  }

  return null;
}

// ================= REGISTER =================

exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      identity, // admin | staff | student | parent | principal | management
    } = req.body;

    const tenantId = await resolveTenantId(req);

    const result = await authService.register({
      name,
      email,
      password,
      tenantId,
      identity,
      actor: req.user || null,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ================= LOGIN =================

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Production → subdomain
    // Localhost → req.body.tenantId
    const tenantId = await resolveTenantId(req);

    const result = await authService.login({
      email,
      password,
      tenantId,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};