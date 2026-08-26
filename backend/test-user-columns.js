const prisma = require("./src/prisma/prismaClient");

async function check() {
  try {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        phone: true,
        avatarUrl: true
      }
    });

    console.log("USER TEST SUCCESS:");
    console.log(user);
  } catch (error) {
    console.error("USER TEST FAILED:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
