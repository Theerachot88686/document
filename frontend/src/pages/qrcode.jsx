import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { QRCodeCanvas } from 'qrcode.react'

const statusMap = {
  SENT: 'ส่งแฟ้ม',
  RECEIVED: 'รับแฟ้ม',
  COMPLETED: 'เสร็จสิ้น',
}

export default function FolderQRCode() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [folder, setFolder] = useState(null)
  const [documents, setDocuments] = useState([])
  const [status, setStatus] = useState('') // สถานะปัจจุบัน (string)
  const [loadingFolder, setLoadingFolder] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [error, setError] = useState(null)

  // ดึงข้อมูลแฟ้มพร้อม statusLogs ด้วย
  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    async function fetchFolder() {
      try {
        setLoadingFolder(true)
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/folders/${folderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลแฟ้มได้')
        const data = await res.json()

        setFolder(data)
        setStatus(data.status || '') // กำหนดสถานะปัจจุบัน

      } catch (err) {
        setError(err.message)
      } finally {
        setLoadingFolder(false)
      }
    }
    fetchFolder()
  }, [folderId, token, navigate])

  // ดึงเอกสารในแฟ้ม
  useEffect(() => {
    if (!folder?.id) return
    async function fetchDocuments() {
      try {
        setLoadingDocs(true)
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/by-folder/?folderId=${folder.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลเอกสารในแฟ้มนี้ได้')
        const data = await res.json()
        setDocuments(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoadingDocs(false)
      }
    }
    fetchDocuments()
  }, [folder?.id, token])

  // บันทึกสถานะแฟ้ม
  const handleSave = async () => {
    if (!folder?.id) {
      Swal.fire('ไม่พบแฟ้มนี้', '', 'error')
      return
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/folders/${folder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'อัปเดตสถานะแฟ้มล้มเหลว')
      }
      Swal.fire('อัปเดตสถานะแฟ้มสำเร็จ', '', 'success')
      setFolder((prev) => ({ ...prev, status }))
    } catch (err) {
      Swal.fire('เกิดข้อผิดพลาด', err.message, 'error')
    }
  }

  // แสดงประวัติการเปลี่ยนสถานะจาก statusLogs
// ฟังก์ชันแสดงประวัติสถานะ (แสดงแค่สถานะและวันที่เริ่ม)
const renderStatusHistory = () => {
  const statusLogs = folder?.statusLogs || []
  if (statusLogs.length === 0) return <p className="italic text-gray-400">ไม่มีประวัติสถานะ</p>

  return (
    <ul className="list-disc list-inside max-h-48 overflow-y-auto text-gray-700 dark:text-gray-300">
      {statusLogs
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        .map((log) => (
          <li key={log.id}>
            {statusMap[log.status] || log.status} — เริ่ม: {new Date(log.startedAt).toLocaleString()}
          </li>
        ))}
    </ul>
  )
}


  if (loadingFolder || loadingDocs) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-100 to-white">
        <div className="text-blue-600 text-xl font-semibold animate-pulse">กำลังโหลดข้อมูล...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6 rounded-lg mx-auto max-w-lg">
        <p className="text-red-700 text-lg font-semibold mb-4">เกิดข้อผิดพลาด: {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition"
        >
          กลับ
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-tr from-blue-50 to-white flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-extrabold text-blue-800 mb-10 drop-shadow-md">{folder.title}</h1>

      <section className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-6xl flex flex-col items-center space-y-10">
        <QRCodeCanvas
          value={folder.qrToken || `folder:${folder.id}`}
          size={200}
          className="p-4 rounded-xl border-4 border-blue-200 bg-white drop-shadow-lg"
        />

        <div className="w-full max-w-4xl space-y-8">
          {/* ชื่อแฟ้ม */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">ชื่อแฟ้ม</h2>
            <p className="text-xl text-gray-800 rounded-md bg-blue-50 p-4 shadow-inner">{folder.title}</p>
          </div>

          {/* ตารางเอกสาร */}
          <div>
            <h2 className="text-3xl font-bold text-blue-700 mb-5 border-b-2 border-blue-300 pb-2">
              เอกสารในแฟ้มนี้
            </h2>
            {documents.length === 0 ? (
              <p className="text-gray-500 italic text-center py-10">ไม่มีเอกสารในแฟ้มนี้</p>
            ) : (
              <div className="overflow-x-auto max-h-96 rounded-xl shadow-lg border border-blue-200">
                <table className="min-w-full divide-y divide-blue-100 text-gray-700">
                  <thead className="bg-blue-600 text-white select-none sticky top-0 z-10">
                    <tr>
                      {['เลขที่เอกสาร', 'เรื่อง', 'ประเภทเอกสาร', 'หน่วยงานปลายทาง ', 'ผู้สร้าง', 'วันที่สร้าง'].map((header) => (
                        <th key={header} className="p-4 text-left font-semibold tracking-wide">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-blue-100 cursor-pointer transition-colors"
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        title={doc.subject || 'ไม่มีรายละเอียด'}
                      >
                        <td className="p-4 max-w-[120px] truncate">{doc.docNumber || '-'}</td>
                        <td className="p-4 max-w-[280px] truncate">{doc.subject || '-'}</td>
                        <td className="p-4 max-w-[160px] truncate">{doc.agencyType || '-'}</td>
                        <td className="p-4 max-w-[140px] truncate">{doc.department || '-'}</td>
                        <td className="p-4 max-w-[150px] truncate">{doc.createdBy?.name || '-'}</td>
                         <td className="p-4">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* เปลี่ยนสถานะแฟ้มเป็น radio */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">สถานะของแฟ้ม</h2>
            <div className="flex flex-wrap gap-6">
              {Object.entries(statusMap).map(([key, label]) => (
                <label key={key} className="inline-flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="status"
                    value={key}
                    checked={status === key}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-800 text-lg">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* แสดงประวัติการเปลี่ยนสถานะ */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">ประวัติการเปลี่ยนสถานะ</h2>
            {renderStatusHistory()}
          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleSave}
              className="cursor-pointer w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg transition-transform hover:scale-105"
            >
              บันทึกสถานะแฟ้ม
            </button>
          </div>

          {/* กลับไปหน้ารายการ */}
          <Link
            to="/documents"
            className="cursor-pointer block text-center text-blue-600 hover:text-blue-800 hover:underline mt-6 font-medium"
          >
            เพิ่มแฟ้มใหม่
          </Link>
        </div>
      </section>
    </main>
  )
}
