const jwt = require("jsonwebtoken");

const prisma = require("../prisma/prismaClient");

const { HttpError } = require("../utils/httpError");

const unauthorized = () =>
  new HttpError(401, "Unauthorized", {
    code: "UNAUTHORIZED",
  });

module.exports = async (req, res, next) => {
  let decoded;

  // ---------------------------------------------------------
  // JWT verification
  // ---------------------------------------------------------
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(unauthorized());
    }

    const token = authHeader.split(" ")[1];

    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    return next(unauthorized());
  }

  // ---------------------------------------------------------
  // User validation
  // ---------------------------------------------------------
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        isDeleted: true,
      },
    });

    if (!user || user.isDeleted) {
      return next(unauthorized());
    }
  } catch (error) {
    return next(error);
  }

  // ---------------------------------------------------------
  // Attach authenticated user to request
  // ---------------------------------------------------------
  req.user = decoded;

  // ---------------------------------------------------------
  // Force password change when required
  // ---------------------------------------------------------
  if (decoded.mustChangePassword) {
    const path = (req.originalUrl || "")
      .split("?")[0]
      .replace(/\/+$/, "");

    const allowed =
      req.method === "POST" &&
      path.endsWith("/auth/change-password");

    if (!allowed) {
      return next(
        new HttpError(403, "Password change required", {
          code: "PASSWORD_CHANGE_REQUIRED",
        })
      );
    }
  }

  next();
};