const performanceService = require("./performance.service");
const {
  generatePerformanceInsights,
} = require("./gemini.service");

function getUserId(req) {
  return (
    req?.user?.userId ||
    req?.user?.id ||
    req?.user?.user?.id ||
    null
  );
}

function getTenantId(req) {
  return (
    req?.user?.tenantId ||
    req?.tenantId ||
    null
  );
}

function isParent(req) {
  return (
    req?.user?.identity === "parent" ||
    req?.user?.role === "parent"
  );
}

const getPerformance = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message:
          "Tenant information is missing.",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user information is missing.",
      });
    }

    if (!isParent(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Only parents can access student performance insights.",
      });
    }

    const academicYearId =
      req.query.academicYearId
        ? Number(req.query.academicYearId)
        : undefined;

    if (
      req.query.academicYearId &&
      !Number.isInteger(academicYearId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid academic year.",
      });
    }

    /*
     * Existing CampusIQ performance service remains
     * responsible for:
     *
     * - parent → child authorization
     * - real database data
     * - academic metrics
     * - prediction
     * - charts/trends
     * - subject analysis
     */
    const result =
      await performanceService.getPerformanceTracker({
        userId,
        tenantId,
        academicYearId,
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Performance information was not found.",
      });
    }

    /*
     * Gemini receives ONLY the already-authorized,
     * aggregated academic information.
     *
     * It does not receive database credentials,
     * tenant information or authentication details.
     */
    const tracker =
      result?.tracker ||
      result?.data ||
      result;

    const aiInsights =
      await generatePerformanceInsights(
        tracker
      );

    const finalTracker = {
      ...tracker,

      aiInsights,

      /*
       * Keep the technical implementation hidden
       * from the parent-facing response.
       */
      prediction: tracker?.prediction || {},
    };

    return res.json({
      success: true,

      data: {
        ...result,

        tracker: finalTracker,
      },
    });
  } catch (error) {
    console.error(
      "GET PERFORMANCE ERROR:",
      error
    );

    return next(error);
  }
};

module.exports = {
  getPerformance,
};