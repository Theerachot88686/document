import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function CreateFolder() {
  const navigate = useNavigate()

  const [folderTitle, setFolderTitle] = useState('')
  const [createdById, setCreatedById] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // ดึงข้อมูลผู้ใช้จาก localStorage
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData) {
      setCreatedById(userData.id)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!folderTitle.trim()) {
      Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อแฟ้มก่อนบันทึก', 'warning')
      setSubmitting(false)
      return
    }

    if (!createdById) {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่', 'error')
      setSubmitting(false)
      return
    }

    const qrToken = uuidv4()

    try {
      const response = await fetch(`${API_BASE_URL}/api/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: folderTitle.trim(),
          createdById: Number(createdById),
          qrToken,
          status: 'รอดำเนินการ',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'การสร้างแฟ้มล้มเหลว')
      }

      Swal.fire('สำเร็จ', 'สร้างแฟ้มเรียบร้อยแล้ว', 'success').then(() => {
        navigate('/documents')
      })
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">สร้างแฟ้มเอกสารใหม่</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">🚫 {error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-semibold mb-1">ชื่อแฟ้ม</label>
            <input
              type="text"
              name="folderTitle"
              value={folderTitle}
              onChange={(e) => setFolderTitle(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="ชื่อแฟ้มเอกสาร เช่น แฟ้มเวร"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'กำลังบันทึก...' : 'สร้างแฟ้มเอกสาร'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
