import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ดึงแฟ้มทั้งหมด
export const getFolders = async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        documents: { select: { id: true, docNumber: true, subject: true } },
        statusLogs: true, // ถ้าต้องการดึงประวัติสถานะด้วย
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
        statusLogs: true,
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
        status: 'SENT',  // ค่าต้องตรงกับ enum FolderStatus
        statusLogs: {
          create: {
            status: 'SENT',
            startedAt: new Date(),
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

  const { title, qrToken, status } = req.body

  try {
    // ดึงแฟ้มพร้อม statusLogs ล่าสุด 1 รายการ
    const existingFolder = await prisma.folder.findUnique({
      where: { id },
      include: { statusLogs: { orderBy: { startedAt: 'desc' }, take: 1 } }
    })
    if (!existingFolder) return res.status(404).json({ message: 'Folder not found' })

    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (qrToken !== undefined) updateData.qrToken = qrToken

    // ถ้ามีการเปลี่ยนสถานะ และต่างจากสถานะเดิม
    if (status !== undefined && status !== existingFolder.status) {
      // ปิดสถานะเก่าที่ยังไม่ปิด (endedAt ยัง null)
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

      // สร้าง statusLog ใหม่ (ผูกกับ folderId)
      await prisma.folderStatusLog.create({
        data: {
          folderId: id,
          status,
          startedAt: new Date()
        }
      })
    }

    // อัพเดตข้อมูลอื่น ๆ (title, qrToken) ถ้ามี
    if (Object.keys(updateData).length > 0) {
      await prisma.folder.update({
        where: { id },
        data: updateData
      })
    }

    // ดึงข้อมูลแฟ้มพร้อม statusLogs ใหม่ เพื่อส่งกลับ
    const updatedFolder = await prisma.folder.findUnique({
      where: { id },
      include: { statusLogs: true }
    })

    res.status(200).json(updatedFolder)
  } catch (error) {
    console.error('Error updating folder:', error)
    res.status(500).json({ message: 'ไม่สามารถแก้ไขแฟ้มได้', error: error.message })
  }
}


// ลบแฟ้ม
export const deleteFolder = async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid folder ID' })

  try {
    const existingFolder = await prisma.folder.findUnique({ where: { id } })
    if (!existingFolder) return res.status(404).json({ message: 'Folder not found' })

    await prisma.folder.delete({ where: { id } })
    res.status(200).json({ message: 'ลบแฟ้มสำเร็จ' })
  } catch (error) {
    console.error('Error deleting folder:', error)
    if (error.code === 'P2003') {
      return res.status(409).json({
        message: 'ไม่สามารถลบแฟ้มได้ เนื่องจากมีเอกสารที่เกี่ยวข้อง กรุณาลบเอกสารก่อน',
        error: error.message,
      })
    }
    res.status(500).json({ message: 'ลบแฟ้มไม่สำเร็จ', error: error.message })
  }
}
