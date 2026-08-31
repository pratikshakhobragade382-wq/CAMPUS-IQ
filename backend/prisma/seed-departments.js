const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 1;
  console.log(`Using tenantId=${tenantId}`);

  const names = [
    'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science',
    'English Literature', 'History', 'Geography', 'Economics', 'Commerce',
    'Accountancy', 'Business Studies', 'Political Science', 'Sociology',
    'Psychology', 'Philosophy', 'Fine Arts', 'Music', 'Physical Education',
    'Environmental Science', 'Statistics', 'Electronics', 'Mechanical Engineering',
    'Civil Engineering', 'Electrical Engineering', 'Information Technology',
    'Biotechnology', 'Microbiology', 'Zoology', 'Botany', 'Home Science',
    'Hindi', 'Sanskrit', 'French', 'German', 'Spanish', 'Journalism',
    'Mass Communication', 'Law', 'Nursing', 'Pharmacy', 'Architecture',
    'Agriculture', 'Veterinary Science', 'Fashion Design', 'Hotel Management',
    'Aviation', 'Aeronautical Engineering', 'Marine Engineering',
    'Petroleum Engineering', 'Textile Engineering',
  ];

  const records = names.map((name) => ({
    name,
    tenantId,
    isDeleted: false,
  }));

  const result = await prisma.department.createMany({
    data: records,
    skipDuplicates: true, // protects against the @@unique([name, tenantId]) constraint
  });

  console.log(`Inserted ${result.count} department records (duplicates skipped if any).`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
