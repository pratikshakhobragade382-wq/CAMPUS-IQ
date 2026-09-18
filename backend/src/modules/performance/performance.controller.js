const performanceService =
  require("./performance.service");

/*
============================================================
 HELPERS
============================================================
*/

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
    req?.user?.identity ===
      "parent" ||
    req?.user?.role ===
      "parent"
  );
}

/*
============================================================
 GET PERFORMANCE
============================================================
*/

const getPerformance = async (
  req,
  res,
  next
) => {
  try {
    const tenantId =
      getTenantId(req);

    const userId =
      getUserId(req);

    /*
     * ------------------------------------------------------
     * TENANT CHECK
     * ------------------------------------------------------
     */

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message:
          "Tenant information is missing.",
      });
    }

    /*
     * ------------------------------------------------------
     * USER CHECK
     * ------------------------------------------------------
     */

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user information is missing.",
      });
    }

    /*
     * ------------------------------------------------------
     * PARENT CHECK
     * ------------------------------------------------------
     */

    if (!isParent(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Only parents can access student performance insights.",
      });
    }

    /*
     * ------------------------------------------------------
     * ACADEMIC YEAR
     * ------------------------------------------------------
     */

    let academicYearId;

    if (
      req.query.academicYearId !==
      undefined
    ) {
      academicYearId =
        Number(
          req.query.academicYearId
        );

      if (
        !Number.isInteger(
          academicYearId
        ) ||
        academicYearId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid academic year.",
        });
      }
    }

    /*
     * ------------------------------------------------------
     * PERFORMANCE SERVICE
     * ------------------------------------------------------
     */

    const result =
      await performanceService.getPerformanceTracker(
        {
          userId,
          tenantId,
          academicYearId,
        }
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Performance information was not found.",
      });
    }

    /*
     * ------------------------------------------------------
     * DO NOT CALL GEMINI AGAIN HERE
     * ------------------------------------------------------
     *
     * performance.service.js already generates its
     * explanation.
     *
     * We expose that explanation as aiInsights so the
     * existing Parent UI can use it.
     * ------------------------------------------------------
     */

    const tracker =
      result?.tracker || null;

    if (tracker) {
      tracker.aiInsights = {
        summary:
          tracker?.explanation
            ?.summary ||
          tracker?.summary ||
          "",

        strengths:
          Array.isArray(
            tracker?.explanation
              ?.strengths
          )
            ? tracker.explanation
                .strengths
            : [],

        focusAreas:
          Array.isArray(
            tracker?.explanation
              ?.focusAreas
          )
            ? tracker.explanation
                .focusAreas
            : [],

        recommendations:
          Array.isArray(
            tracker?.recommendations
          )
            ? tracker.recommendations
            : [],

        parentMessage:
          "Use these academic insights as a guide for supporting consistent learning and communication with the school.",
      };
    }

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    return res.json({
      success: true,

      data: {
        ...result,

        tracker,
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