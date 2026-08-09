const { z, safeText, idParam } = require("../../validation/schemas");

/**
 * ============================================================
 * CREATE CLASS
 * ============================================================
 */
const createClassBody = z
  .object({
    name: safeText("Class name", { max: 80 }),
  })
  .strip();

/**
 * ============================================================
 * UPDATE CLASS
 * ============================================================
 */
const updateClassBody = z
  .object({
    name: safeText("Class name", { max: 80 }),
    section: safeText("Section name", { max: 20 }),
  })
  .strip();

/**
 * ============================================================
 * ADD SECTION
 * ============================================================
 */
const addSectionBody = z
  .object({
    name: safeText("Section name", { max: 20 }),
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