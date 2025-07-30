import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // เข้ารหัสรหัสผ่าน
  const hashedPassword = await bcrypt.hash('123456', 10)

  // สร้างผู้ใช้ admin
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

  // สร้างผู้ใช้ทั่วไป
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

  // สร้างแฟ้ม
  const folder1 = await prisma.folder.create({
    data: {
      title: 'แฟ้มเอกสารสำคัญ',
      qrToken: 'QR-1234567890',
      createdById: user1.id,
      status: 'SENT',
    },
  })

  // บันทึกสถานะเริ่มต้นของแฟ้มใน FolderStatusLog
  await prisma.folderStatusLog.create({
    data: {
      folderId: folder1.id,
      status: 'SENT',
      startedAt: new Date(),
      endedAt: null,
    },
  })

  // สร้างเอกสารในแฟ้ม
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
