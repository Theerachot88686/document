import express from 'express'
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentsByFolderId,
  createFolderWithDocuments
} from '../controllers/documentController.js'

const router = express.Router()

// ดึงเอกสารตาม folderId (query parameter) — วางก่อน /:id เพื่อไม่ให้โดนจับแทน
router.get('/by-folder', getDocumentsByFolderId)

// สร้างแฟ้มพร้อมเอกสาร
router.post('/folders-with-documents', createFolderWithDocuments)

// ดึงเอกสารทั้งหมด
router.get('/', getDocuments)

// ดึงเอกสารตาม id
router.get('/:id', getDocumentById)

// สร้างเอกสารใหม่ (ไม่ใช้ multer)
router.post('/', createDocument)

// แก้ไขเอกสาร
router.put('/:id', updateDocument)

// ลบเอกสาร
router.delete('/:id', deleteDocument)

export default router
