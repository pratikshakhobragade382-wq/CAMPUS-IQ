const {
  z,
  safeText,
  idParam,
} = require("../../validation/schemas");

/*
============================================================
CREATE SECTION
============================================================
*/
const createSectionBody = z
  .object({
    name: safeText("Section name", {
      max: 20,
    }),

    classId: z.coerce
      .number()
      .int()
      .positive(),

    classTeacherId: z.coerce
      .number()
      .int()
      .positive()
      .optional(),
  })
  .strip();

/*
============================================================
UPDATE SECTION
============================================================

classTeacherId:

number -> assign/change class incharge
null   -> remove class incharge
omitted -> keep existing class incharge
============================================================
*/
const updateSectionBody = z
  .object({
    name: safeText("Section name", {
      max: 20,
    }).optional(),

    classId: z.coerce
      .number()
      .int()
      .positive()
      .optional(),

    classTeacherId: z
      .union([
        z.coerce
          .number()
          .int()
          .positive(),

        z.null(),
      ])
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.name === undefined &&
      value.classId === undefined &&
      value.classTeacherId === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,

        message:
          "At least one field (name, classId or classTeacherId) is required",
      });
    }
  })
  .strip();

/*
============================================================
SECTION ID PARAMETER
============================================================
*/
const sectionIdParam = idParam("id");

module.exports = {
  createSectionBody,
  updateSectionBody,
  sectionIdParam,
};