const bcrypt = require("bcrypt");
const prisma = require("./src/prisma/prismaClient");

async function updatePassword() {
  const hashedPassword = await bcrypt.hash("Test@12345", 12);

  const user = await prisma.user.update({
    where: {
      email_tenantId: {
        email: "john@school.com",
        tenantId: 1,
      },
    },
    data: {
      password: hashedPassword,
    },
  });

  console.log("Password updated for:", user.email);

  await prisma.$disconnect();
}

updatePassword().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});