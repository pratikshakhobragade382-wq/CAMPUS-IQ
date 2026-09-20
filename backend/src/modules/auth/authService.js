const bcrypt = require('bcrypt');
const prisma = require('../../prisma/prismaClient');
const { generateToken } = require('../../utils/jwt');
const { HttpError } = require('../../utils/httpError');
const { email: emailSchema } = require('../../validation/schemas');

// Identities that carry elevated, tenant-wide permissions.
// Creating one of these requires an existing privileged caller, except for
// the very first such account in a brand-new tenant (bootstrap case).
const PRIVILEGED_IDENTITIES = ['admin', 'management', 'principal'];

function getBcryptCost() {
  // Keep a safe, bounded cost to avoid accidental DoS from misconfiguration.
  const raw = Number.parseInt(process.env.BCRYPT_COST || '12', 10);
  const cost = Number.isFinite(raw) ? raw : 12;
  return Math.min(14, Math.max(10, cost));
}

// ================= REGISTER =================
exports.register = async ({
  name,
  email,
  password,
  tenantId,
  identity, // who this user IS: admin | staff | student | parent | principal | management
  actor, // decoded JWT of the caller, if any (set by optionalAuth) — null for key-only calls
}) => {
  if (!identity) {
    throw new HttpError(400, 'identity is required', { code: 'MISSING_IDENTITY' });
  }

  // Ensure tenant exists (prevents creating users under arbitrary tenantIds).
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });
  if (!tenant) {
    throw new HttpError(400, 'Invalid tenantId', { code: 'INVALID_REFERENCE' });
  }

  if (PRIVILEGED_IDENTITIES.includes(identity)) {
    const actorIsPrivileged =
      actor &&
      actor.tenantId === tenantId &&
      PRIVILEGED_IDENTITIES.includes(actor.identity);

    if (!actorIsPrivileged) {
      // No privileged caller — only allow this if the tenant has no
      // privileged account yet (first-admin bootstrap for a new school).
      const existingPrivilegedCount = await prisma.user.count({
        where: { tenantId, identity: { in: PRIVILEGED_IDENTITIES }, isDeleted: false },
      });

      if (existingPrivilegedCount > 0) {
        throw new HttpError(
          403,
          'Only an existing admin, management, or principal account can create this identity',
          { code: 'PRIVILEGED_REGISTRATION_FORBIDDEN' }
        );
      }
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email_tenantId: { email, tenantId } },
  });
  if (existingUser) {
    throw new HttpError(409, 'User already exists', { code: 'DUPLICATE' });
  }

  const hashedPassword = await bcrypt.hash(password, getBcryptCost());

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      tenantId,
      identity,
    },
  });

  const token = generateToken(user);
  const { password: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
};

// ================= LOGIN =================
// tenantId is resolved server-side from the request subdomain
// (e.g. school1.dpinfosystem.in → tenantId for school1)
// so the client does NOT send tenantId explicitly.
async function resolveLoginEmail(identifier, tenantId) {
  const raw = String(identifier || '').trim();
  if (!raw) return null;

  if (raw.includes('@')) {
    const parsed = emailSchema.safeParse(raw);
    return parsed.success ? parsed.data : raw.toLowerCase();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subdomain: true },
  });
  if (!tenant?.subdomain) return null;

  return `${raw.toLowerCase()}@${tenant.subdomain.toLowerCase()}.student`;
}

exports.login = async ({ identifier, password, tenantId }) => {
  if (!tenantId) {
    throw new HttpError(400, 'Tenant could not be resolved', { code: 'MISSING_TENANT' });
  }

  const email = await resolveLoginEmail(identifier, tenantId);
  if (!email) {
    throw new HttpError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }

  const user = await prisma.user.findUnique({
    where: { email_tenantId: { email, tenantId } },
    include: { staff: { select: { id: true, role: true } } },
  });
  if (!user || user.isDeleted) {
    throw new HttpError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new HttpError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }

  const token = generateToken(user);
  const { password: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
};


// ================= CHANGE PASSWORD =================
exports.changePassword = async ({ userId, tenantId, currentPassword, newPassword }) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, isDeleted: false },
  });
  if (!user) {
    throw new HttpError(401, 'Invalid credentials', { code: 'INVALID_CREDENTIALS' });
  }

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) {
    throw new HttpError(401, 'Current password is incorrect', { code: 'INVALID_CREDENTIALS' });
  }

  const hashed = await bcrypt.hash(newPassword, getBcryptCost());
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, mustChangePassword: false, tokenVersion: { increment: 1 } },
    include: { staff: { select: { id: true, role: true } } },
  });

  const token = generateToken(updated);
  const { password: _, ...safeUser } = updated;
  return { user: safeUser, token };
};
