const { z, safeText, idParam } = require("../../validation/schemas");

/**
 * ============================================================
 * CREATE CLASS
 * ============================================================
 *
 * Teacher can create:
 * - Class name
 * - Optional first section
 */
const createClassBody = z
  .object({
    name: safeText("Class name", { max: 80 }),

    section: safeText("Section name", {
      max: 20,
    }).optional(),
  })
  .strip();

/**
 * ============================================================
 * UPDATE CLASS
 * ============================================================
 *
 * Existing admin functionality.
 */
const updateClassBody = z
  .object({
    name: safeText("Class name", { max: 80 }),

    section: safeText("Section name", {
      max: 20,
    }),
  })
  .strip();

/**
 * ============================================================
 * ADD SECTION
 * ============================================================
 */
const addSectionBody = z
  .object({
    name: safeText("Section name", {
      max: 20,
    }),
  })
  .strip();

/**
 * ============================================================
 * CLASS ID PARAM
 * ============================================================
 */
const classIdParam = idParam("classId");

module.exports = {
  createClassBody,
  updateClassBody,
  addSectionBody,
  classIdParam,
};