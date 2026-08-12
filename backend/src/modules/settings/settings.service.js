const bcrypt = require("bcrypt");
const prisma = require("../../prisma/prismaClient");
const { HttpError } = require("../../utils/httpError");

function getBcryptCost() {
  const raw = Number.parseInt(process.env.BCRYPT_COST || "12", 10);
  const cost = Number.isFinite(raw) ? raw : 12;
  return Math.min(14, Math.max(10, cost));
}

/**
 * ============================================================
 * SCHOOL INFO
 * ============================================================
 */
exports.getSchoolInfo = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      subdomain: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      logoUrl: true,
    },
  });

  if (!tenant) {
    throw new HttpError(404, "Tenant not found", { code: "TENANT_NOT_FOUND" });
  }

  return tenant;
};

exports.updateSchoolInfo = async (tenantId, data) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    throw new HttpError(404, "Tenant not found", { code: "TENANT_NOT_FOUND" });
  }

  return await prisma.tenant.update({
    where: { id: tenantId },
    data,
    select: {
      id: true,
      name: true,
      subdomain: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      logoUrl: true,
    },
  });
};

/**
 * ============================================================
 * APP PREFERENCES
 * ============================================================
 */
exports.getPreferences = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      defaultAcademicYear: true,
      defaultClass: true,
      defaultSection: true,
    },
  });

  if (!tenant) {
    throw new HttpError(404, "Tenant not found", { code: "TENANT_NOT_FOUND" });
  }

  return tenant;
};

exports.updatePreferences = async (tenantId, data) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    throw new HttpError(404, "Tenant not found", { code: "TENANT_NOT_FOUND" });
  }

  return await prisma.tenant.update({
    where: { id: tenantId },
    data,
    select: {
      defaultAcademicYear: true,
      defaultClass: true,
      defaultSection: true,
    },
  });
};

/**
 * ============================================================
 * MY PROFILE
 * ============================================================
 */
exports.getProfile = async (userId, tenantId) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      identity: true,
    },
  });

  if (!user) {
    throw new HttpError(404, "User not found", { code: "USER_NOT_FOUND" });
  }

  return user;
};

exports.updateProfile = async (userId, tenantId, data) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, isDeleted: false },
    select: { id: true },
  });

  if (!user) {
    throw new HttpError(404, "User not found", { code: "USER_NOT_FOUND" });
  }

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId,
        id: { not: userId },
      },
      select: { id: true },
    });
    if (existing) {
      throw new HttpError(409, "Email already in use", { code: "DUPLICATE_EMAIL" });
    }
  }

  return await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      identity: true,
    },
  });
};

/**
 * ============================================================
 * CHANGE PASSWORD
 * ============================================================
 */
exports.changePassword = async (userId, tenantId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, isDeleted: false },
  });

  if (!user) {
    throw new HttpError(404, "User not found", { code: "USER_NOT_FOUND" });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new HttpError(401, "Current password is incorrect", { code: "INVALID_CREDENTIALS" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, getBcryptCost());

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
};
