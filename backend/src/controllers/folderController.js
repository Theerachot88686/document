import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ดึงแฟ้มทั้งหมด
export const getFolders = async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        documents: { select: { id: true, docNumber: true, subject: true } },
        statusLogs: {
          include: {
            user: { select: { id: true, name: true, username: true } } // ดึงคนเปลี่ยนสถานะ
          },
          orderBy: { startedAt: 'desc' }
        },
      },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json(folders)
  } catch (error) {
    console.error('Error fetching folders:', error)
    res.status(500).json({ message: 'Failed to fetch folders', error: error.message })
  }
}

// ดึงแฟ้มตาม ID
export const getFolderById = async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid folder ID' })

  try {
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        documents: { select: { id: true, docNumber: true, subject: true } },
        statusLogs: {
          include: {
            user: { select: { id: true, name: true, username: true } }
          },
          orderBy: { startedAt: 'desc' }
        },
      }
    })
    if (!folder) return res.status(404).json({ message: 'Folder not found' })
    res.status(200).json(folder)
  } catch (error) {
    console.error('Error fetching folder:', error)
    res.status(500).json({ message: 'Failed to fetch folder', error: error.message })
  }
}

// สร้างแฟ้มใหม่
export const createFolder = async (req, res) => {
  try {
    const { title, createdById, qrToken } = req.body

    if (!title || !createdById || !qrToken) {
      return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' })
    }

    // สร้างแฟ้มและบันทึกสถานะเริ่มต้นใน statusLogs
    const newFolder = await prisma.folder.create({
      data: {
        title,
        createdById: Number(createdById),
        qrToken,
        status: 'ARCHIVED',  // ค่าต้องตรงกับ enum FolderStatus
        statusLogs: {
          create: {
            status: 'ARCHIVED',
            startedAt: new Date(),
            userId: Number(createdById), // คนสร้างแฟ้มถือเป็นคนเปลี่ยนสถานะเริ่มต้น
          }
        }
      },
      include: {
        statusLogs: true
      }
    })

    res.status(201).json(newFolder)
  } catch (error) {
    console.error('Create folder error:', error)
    res.status(500).json({ message: 'ไม่สามารถสร้างแฟ้มได้', error: error.message })
  }
}

// แก้ไขแฟ้ม

export const updateFolder = async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid folder ID' })

  // department ควรเป็น string ที่ตรงกับชื่อ enum เท่านั้น เช่น "STRATEGIC_AND_PROJECTS"
  // ควรตรวจสอบความถูกต้องของค่า department ก่อนใช้งาน
  const { title, qrToken, status, department, remark, userId } = req.body

  // กำหนดรายการ enum ที่อนุญาต
const validDepartments = [
  'STRATEGIC_AND_PROJECTS',
  'FINANCE_GROUP',
  'HUMAN_RESOURCES',
  'NURSING_GROUP',
  'SECRETARIAT',
  'DIGITAL_HEALTH_MISSION',
  'SUPPLY_GROUP',
  'ADMINISTRATIVE_GROUP'
]


  if (department && !validDepartments.includes(department)) {
    return res.status(400).json({ message: 'ค่า department ไม่ถูกต้อง' })
  }

  try {
    const existingFolder = await prisma.folder.findUnique({
      where: { id },
      include: { statusLogs: { orderBy: { startedAt: 'desc' }, take: 1 } }
    })
    if (!existingFolder) return res.status(404).json({ message: 'Folder not found' })

    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (qrToken !== undefined) updateData.qrToken = qrToken

    if (status !== undefined && status !== existingFolder.status) {
      if (!userId) {
        return res.status(400).json({ message: 'ต้องระบุ userId เพื่อบันทึกการเปลี่ยนสถานะ' })
      }

      // ปิดสถานะเก่าที่ยังไม่ปิด
      const lastStatusLog = existingFolder.statusLogs[0]
      if (lastStatusLog && !lastStatusLog.endedAt) {
        await prisma.folderStatusLog.update({
          where: { id: lastStatusLog.id },
          data: { endedAt: new Date() }
        })
      }

      // อัพเดตสถานะแฟ้ม
      await prisma.folder.update({
        where: { id },
        data: { status }
      })

      // สร้าง statusLog ใหม่ พร้อมบันทึก department (enum) และ remark
      await prisma.folderStatusLog.create({
        data: {
          folderId: id,
          status,
          startedAt: new Date(),
          userId: Number(userId),
          department: department || null,
          remark: remark || null,
        }
      })
    }

    // อัพเดตข้อมูลอื่น ๆ
    if (Object.keys(updateData).length > 0) {
      await prisma.folder.update({
        where: { id },
        data: updateData
      })
    }

    const updatedFolder = await prisma.folder.findUnique({
      where: { id },
      include: {
        statusLogs: {
          include: { user: { select: { id: true, name: true, username: true } } },
          orderBy: { startedAt: 'desc' }
        }
      }
    })

    res.status(200).json(updatedFolder)
  } catch (error) {
    console.error('Error updating folder:', error)
    res.status(500).json({ message: 'ไม่สามารถแก้ไขแฟ้มได้', error: error.message })
  }
}


// ลบแฟ้ม
export const deleteFolder = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid folder ID' });

  try {
    // ⏳ ตรวจสอบว่า documents และ statusLogs ที่เกี่ยวข้องมีอะไรบ้าง
    const docs = await prisma.document.findMany({ where: { folderId: id } });
    console.log('📁 Documents to delete:', docs);

    const logs = await prisma.folderStatusLog.findMany({ where: { folderId: id } });
    console.log('📜 StatusLogs to delete:', logs);

    // 🔥 1. ลบ StatusLogs
    await prisma.folderStatusLog.deleteMany({
      where: { folderId: id },
    });

    // 🔥 2. ลบ Documents
    await prisma.document.deleteMany({
      where: { folderId: id },
    });

    // ✅ 3. ลบแฟ้ม
    await prisma.folder.delete({
      where: { id },
    });

    res.status(200).json({ message: 'ลบแฟ้มสำเร็จ' });
  } catch (error) {
    console.error('❌ ลบแฟ้มผิดพลาด:', error);
    res.status(500).json({
      message: 'ลบแฟ้มไม่สำเร็จ',
      error: error.message,
      code: error.code,
    });
  }
};







