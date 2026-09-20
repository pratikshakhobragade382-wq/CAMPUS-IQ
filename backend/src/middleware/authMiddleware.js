const jwt = require("jsonwebtoken");
const prisma = require("../prisma/prismaClient");
const { HttpError } = require("../utils/httpError");

const unauthorized = () =>
  new HttpError(401, "Unauthorized", { code: "UNAUTHORIZED" });

module.exports = async (req, res, next) => {
  let decoded;

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(unauthorized());
    }

    decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    return next(unauthorized());
  }

  // Revocation check: deleted users and tokens issued before a password
  // reset/change are rejected immediately.
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isDeleted: true, tokenVersion: true },
    });

    if (
      !user ||
      user.isDeleted ||
      user.tokenVersion !== (decoded.tokenVersion || 0)
    ) {
      return next(unauthorized());
    }
  } catch (error) {
    return next(error);
  }

  req.user = decoded;

  if (decoded.mustChangePassword) {
    const path = (req.originalUrl || "").split("?")[0].replace(/\/+$/, "");
    const allowed =
      req.method === "POST" && path.endsWith("/auth/change-password");
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
