// index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Import Routes
// ตรวจสอบให้แน่ใจว่า path ถูกต้องตามโครงสร้างไฟล์ของคุณ
import userRoutes from './src/routes/userRoutes.js'
import documentRoutes from './src/routes/documentRoutes.js'
import authRoutes from './src/routes/authRoutes.js';
import folderRoutes from './src/routes/folderRoutes.js'


dotenv.config()

const app = express()
export const prisma = new PrismaClient() // Export prisma client if you want to use it directly in some cases, otherwise keep it local

// Middleware
app.use(cors())
app.use(express.json())

// Base Route
app.get('/', (req, res) => {
  res.send('Document Tracking System API is running!')
})
app.use('/api', authRoutes);
// Use Routes - นี่คือส่วนที่สำคัญในการเชื่อมต่อ
// ทุก request ที่เริ่มต้นด้วย /api/users จะถูกจัดการโดย userRoutes
app.use('/api/users', userRoutes)
// ทุก request ที่เริ่มต้นด้วย /api/documents จะถูกจัดการโดย documentRoutes
app.use('/api/documents', documentRoutes)

app.use('/api/folders', folderRoutes)


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server is running at: https://document-1-se6b.onrender.com`)
})