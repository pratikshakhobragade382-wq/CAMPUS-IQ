const { z, safeText, email, password } = require("../../validation/schemas");

/**
 * ============================================================
 * SCHOOL INFO (Tenant) — admin only
 * ============================================================
 */
const updateSchoolBody = z
  .object({
    name: safeText("School name", { max: 150 }).optional(),
    address: safeText("Address", { max: 255, min: 0 }).optional(),
    phone: safeText("Phone", { max: 20, min: 0 }).optional(),
    email: email.optional(),
    website: safeText("Website", { max: 255, min: 0 }).optional(),
    logoUrl: safeText("Logo URL", { max: 500, min: 0 }).optional(),
  })
  .strip();

/**
 * ============================================================
 * APP PREFERENCES (Tenant) — admin only
 * ============================================================
 */
const updatePreferencesBody = z
  .object({
    defaultAcademicYear: safeText("Default Academic Year", { max: 20, min: 0 }).optional(),
    defaultClass: safeText("Default Class", { max: 20, min: 0 }).optional(),
    defaultSection: safeText("Default Section", { max: 20, min: 0 }).optional(),
  })
  .strip();

/**
 * ============================================================
 * MY PROFILE (User) — any authenticated user
 * ============================================================
 */
const updateProfileBody = z
  .object({
    name: safeText("Name", { max: 100 }).optional(),
    email: email.optional(),
    phone: safeText("Phone", { max: 20, min: 0 }).optional(),
    avatarUrl: safeText("Avatar URL", { max: 500, min: 0 }).optional(),
  })
  .strip();

/**
 * ============================================================
 * CHANGE PASSWORD — any authenticated user
 * ============================================================
 */
const changePasswordBody = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(72),
    newPassword: password,
  })
  .strip();

module.exports = {
  updateSchoolBody,
  updatePreferencesBody,
  updateProfileBody,
  changePasswordBody,
};
