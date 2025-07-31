import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  const user1 = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      name: 'Admin User',
      role: 'admin',
    },
    create: {
      name: 'Admin User',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { username: 'user' },
    update: {
      name: 'Normal User',
      role: 'user',
    },
    create: {
      name: 'Normal User',
      username: 'user',
      password: hashedPassword,
      role: 'user',
    },
  })

  const folder1 = await prisma.folder.create({
    data: {
      title: 'แฟ้มเอกสารสำคัญ',
      qrToken: 'QR-1234567890',
      createdById: user1.id,
      status: 'SENT',
    },
  })

  await prisma.folderStatusLog.create({
    data: {
      folderId: folder1.id,
      status: 'SENT',
      startedAt: new Date(),
      endedAt: null,
      department: 'SECRETARIAT',    // กำหนด enum value ที่ถูกต้อง
      remark: 'สถานะเริ่มต้นแฟ้ม',
      userId: user1.id,
    },
  })

  await prisma.document.createMany({
    data: [
      {
        docNumber: 'DOC-2025-0001',
        agencyType: 'กรมการศึกษา',
        department: 'ฝ่ายวิชาการ',
        subject: 'หนังสือราชการเรื่องที่ 1',
        sender: 'นายสมชาย',
        createdById: user1.id,
        folderId: folder1.id,
        createdAt: new Date(),
      },
      {
        docNumber: 'DOC-2025-0002',
        agencyType: 'กรมการศึกษา',
        department: 'ฝ่ายวิชาการ',
        subject: 'หนังสือราชการเรื่องที่ 2',
        sender: 'นางสาวสุมิตรา',
        createdById: user2.id,
        folderId: folder1.id,
        createdAt: new Date(),
      },
    ],
  })

  console.log('🎉 Seed data created successfully.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
