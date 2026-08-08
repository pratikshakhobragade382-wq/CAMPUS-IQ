const prisma = require("./src/prisma/prismaClient");

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Demo School",
      subdomain: "school1",
    },
  });
  console.log("Tenant ready:", tenant);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
