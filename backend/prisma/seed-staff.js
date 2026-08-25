const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna',
  'Ishaan', 'Rohan', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Myra',
  'Anika', 'Navya', 'Riya', 'Priya', 'Aarohi', 'Ira', 'Kavya', 'Meera',
  'Aryan', 'Dhruv', 'Kabir', 'Yash', 'Rudra', 'Vikram', 'Nikhil', 'Rahul',
  'Sneha', 'Pooja', 'Neha', 'Divya', 'Anjali', 'Shreya', 'Tanvi', 'Isha',
  'Amit', 'Sanjay', 'Rajesh', 'Suresh', 'Manoj', 'Deepak', 'Vinod', 'Ashok',
  'Lakshmi', 'Radha',
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Rao',
  'Nair', 'Menon', 'Iyer', 'Joshi', 'Mehta', 'Shah', 'Desai', 'Kulkarni',
  'Chavan', 'Jadhav', 'Pawar', 'Deshmukh', 'Bhatt', 'Trivedi', 'Agarwal',
  'Mishra', 'Yadav', 'Chauhan', 'Malhotra', 'Kapoor', 'Bose', 'Sen',
];

const roles = [
  'teacher', 'teacher', 'teacher', 'teacher', 'teacher', // weighted toward teacher
  'accountant', 'librarian', 'clerk', 'receptionist', 'nurse',
  'counselor', 'coordinator', 'lab_assistant', 'peon',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return '9' + Math.floor(100000000 + Math.random() * 899999999).toString();
}

async function main() {
  const anyStaff = await prisma.staff.findFirst({ orderBy: { id: 'asc' } });
  if (!anyStaff) {
    throw new Error('No existing Staff rows found — cannot infer tenantId.');
  }
  const tenantId = anyStaff.tenantId;
  console.log(`Using tenantId=${tenantId}`);

  const departments = await prisma.department.findMany({
    where: { tenantId, isDeleted: false },
    select: { id: true },
  });
  console.log(`Found ${departments.length} departments to assign from.`);

  const COUNT = 50;
  const records = [];
  const usedEmails = new Set();

  for (let i = 0; i < COUNT; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const name = `${first} ${last}`;
    let email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@campusiq-staff.com`;
    while (usedEmails.has(email)) {
      email = `${first.toLowerCase()}.${last.toLowerCase()}${i}.${Math.floor(Math.random()*1000)}@campusiq-staff.com`;
    }
    usedEmails.add(email);

    const role = pick(roles);
    const dept = departments.length > 0 ? pick(departments) : null;

    records.push({
      employeeId: `EMP-SEED-${String(i + 1).padStart(3, '0')}`,
      name,
      email,
      phone: randomPhone(),
      mobileNo: randomPhone(),
      role,
      departmentId: dept ? dept.id : null,
      tenantId,
      isDeleted: false,
    });
  }

  const result = await prisma.staff.createMany({
    data: records,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} staff records.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
