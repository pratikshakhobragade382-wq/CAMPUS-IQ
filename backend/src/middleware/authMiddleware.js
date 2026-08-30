const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        Object.assign(new Error("Unauthorized"), {
          statusCode: 401,
          code: "UNAUTHORIZED",
        })
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return next(
      Object.assign(new Error("Unauthorized"), {
        statusCode: 401,
        code: "UNAUTHORIZED",
      })
    );
  }
};