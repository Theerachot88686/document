import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export const createFolderWithDocuments = async (req, res) => {
  const { folderTitle, createdById, documents } = req.body

  if (!folderTitle || !createdById || !Array.isArray(documents)) {
    return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' })
  }

  try {
    const folder = await prisma.folder.create({
      data: {
        title: folderTitle,
        qrToken: uuidv4(),
        createdById: Number(createdById),
        documents: {
          create: documents.map(doc => ({
            docNumber: doc.docNumber,
            subject: doc.subject,
            agencyType: doc.agencyType || '',
            department: doc.department,
            sender: doc.sender,
            receiverId: doc.receiverId ? Number(doc.receiverId) : null,
            status: doc.status,
            description: doc.description,
            createdById: Number(createdById),
          })),
        },
      },
      include: { documents: true },
    })

    return res.status(201).json(folder)
  } catch (error) {
    console.error('Create folder with documents error:', error)
    res.status(500).json({ message: 'สร้างแฟ้มพร้อมเอกสารล้มเหลว', error: error.message })
  }
}

export const getDocumentsByFolderId = async (req, res) => {
  const folderId = parseInt(req.query.folderId)
  if (isNaN(folderId)) {
    return res.status(400).json({ message: 'Invalid folderId parameter' })
  }

  try {
    const documents = await prisma.document.findMany({
      where: { folderId },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.status(200).json(documents)
  } catch (error) {
    console.error('Error fetching documents by folderId:', error)
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message })
  }
}

export const getDocuments = async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      include: {
        createdBy: { select: { id: true, name: true, username: true, role: true } },
        receiver: { select: { id: true, name: true, username: true, role: true } },
        folder: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.status(200).json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    res.status(500).json({ message: 'Failed to retrieve documents.', error: error.message })
  }
}

export const getDocumentById = async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid Document ID provided.' })

  try {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, username: true, role: true } },
        receiver: { select: { id: true, name: true, username: true, role: true } },
        folder: { select: { id: true, title: true } },
      },
    })
    if (!document) return res.status(404).json({ message: 'Document not found.' })
    res.status(200).json(document)
  } catch (error) {
    console.error(`Error fetching document with ID ${id}:`, error)
    res.status(500).json({ message: `Failed to retrieve document with ID ${id}.`, error: error.message })
  }
}

export const createDocument = async (req, res) => {
  try {
    const {
      docNumber,
      agencyType = '',
      department,
      subject,
      sender,
      status,
      description,
      createdById,
      receiverId,
      folderId,
    } = req.body

    if (!docNumber || !subject || !createdById) {
      return res.status(400).json({ message: 'กรุณากรอกเลขที่เอกสาร, เรื่อง และผู้สร้าง' })
    }

    const createdByNum = Number(createdById)
    if (isNaN(createdByNum) || createdByNum <= 0) {
      return res.status(400).json({ message: 'ข้อมูลผู้สร้างไม่ถูกต้อง' })
    }

const newDoc = await prisma.document.create({
  data: {
    docNumber,
    agencyType,
    department,
    subject,
    sender,
    status,
    description,
    createdById: createdByNum,
    receiverId: receiverId ? Number(receiverId) : null,
    folderId: folderId ? Number(folderId) : null,
    // ลบ filePath ออกไป
  },
  include: {
    createdBy: true,
    receiver: true,
    folder: true,
  },
})

    res.status(201).json(newDoc)
  } catch (error) {
    console.error('Create document error:', error)
    res.status(500).json({ message: 'ไม่สามารถสร้างเอกสารได้', error: error.message })
  }
}

export const updateDocument = async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid Document ID provided.' })

  const {
    docNumber,
    agencyType,
    department,
    subject,
    sender,
    status,
    description,
    receiverId,
    folderId,
  } = req.body

  try {
    const existingDocument = await prisma.document.findUnique({ where: { id } })
    if (!existingDocument) return res.status(404).json({ message: 'Document not found.' })

    const updateData = {}

    if (docNumber !== undefined) updateData.docNumber = docNumber
    if (agencyType !== undefined) updateData.agencyType = agencyType
    if (department !== undefined) updateData.department = department
    if (subject !== undefined) updateData.subject = subject
    if (sender !== undefined) updateData.sender = sender
    if (status !== undefined) updateData.status = status
    if (description !== undefined) updateData.description = description
    if (receiverId !== undefined) updateData.receiverId = receiverId ? Number(receiverId) : null
    if (folderId !== undefined) updateData.folderId = folderId ? Number(folderId) : null


    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' })
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: true,
        receiver: true,
        folder: true,
      },
    })

    res.status(200).json({ message: 'Document updated successfully.', document })
  } catch (error) {
    console.error(`Error updating document with ID ${id}:`, error)
    res.status(500).json({ message: `Failed to update document with ID ${id}.`, error: error.message })
  }
}

export const deleteDocument = async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid Document ID provided.' })

  try {
    const existingDocument = await prisma.document.findUnique({ where: { id } })
    if (!existingDocument) return res.status(404).json({ message: 'Document not found.' })

    await prisma.document.delete({ where: { id } })

    res.status(200).json({ message: 'Document deleted successfully.' })
  } catch (error) {
    console.error(`Error deleting document with ID ${id}:`, error)
    if (error.code === 'P2003') {
      return res.status(409).json({
        message: 'Cannot delete document. It is associated with other records. Please delete them first or configure cascading deletes in your schema.',
        error: error.message,
      })
    }
    res.status(400).json({ message: `Failed to delete document with ID ${id}.`, error: error.message })
  }
}
