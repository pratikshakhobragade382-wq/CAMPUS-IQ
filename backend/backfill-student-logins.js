const bcrypt = require("bcrypt");
const fs = require("fs");
const prisma = require("./src/prisma/prismaClient");

const DRY = process.argv.includes("--dry");
const cost = Math.min(14, Math.max(10, parseInt(process.env.BCRYPT_COST || "12", 10) || 12));
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric",
});
const q = (v) => `"${String(v).replace(/"/g, '""')}"`;

(async () => {
  const students = await prisma.student.findMany({
    where: { isDeleted: false, user: null },
    select: { id: true, admissionNo: true, studentName: true, dateOfBirth: true, tenantId: true },
  });

  const subdomains = {};
  const rows = [["admissionNo", "name", "loginId", "password", "passwordType"]];
  let created = 0, skipped = 0;

  for (const s of students) {
    if (!(s.tenantId in subdomains)) {
      const t = await prisma.tenant.findUnique({ where: { id: s.tenantId }, select: { subdomain: true } });
      subdomains[s.tenantId] = t && t.subdomain ? t.subdomain.toLowerCase() : null;
    }
    const sub = subdomains[s.tenantId];
    if (!sub) { console.log("SKIP (no tenant subdomain):", s.admissionNo); skipped++; continue; }

    const email = `${s.admissionNo.toLowerCase()}@${sub}.student`;
    const exists = await prisma.user.findUnique({
      where: { email_tenantId: { email, tenantId: s.tenantId } },
    });
    if (exists) { console.log("SKIP (email already used):", email); skipped++; continue; }

    const hasDob = !!s.dateOfBirth;
    const password = hasDob
      ? fmt.format(new Date(s.dateOfBirth)).replace(/\//g, "")
      : `${s.admissionNo}@123`;

    if (!DRY) {
      await prisma.user.create({
        data: {
          name: s.studentName, email,
          password: await bcrypt.hash(password, cost),
          tenantId: s.tenantId, identity: "student", studentId: s.id, mustChangePassword: true,
        },
      });
    }
    rows.push([s.admissionNo, s.studentName, s.admissionNo, password, hasDob ? "DOB" : "FALLBACK"]);
    created++;
  }

  console.log(`${DRY ? "[DRY RUN] would create" : "created"}: ${created}, skipped: ${skipped}`);
  if (!DRY && created) {
    fs.writeFileSync("backfill-credentials.csv", rows.map((r) => r.map(q).join(",")).join("\n"), { mode: 0o600 });
    console.log("credentials written to backfill-credentials.csv");
  }
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
