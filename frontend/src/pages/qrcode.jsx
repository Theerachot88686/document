import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { QRCodeCanvas } from 'qrcode.react'

const statusMap = {
  ARCHIVED: 'เริ่มต้น',
  SENT: 'ส่งแฟ้ม',
  RECEIVED: 'รับแฟ้ม',
  COMPLETED: 'เสร็จสิ้น',
}

const departmentMap = {
  STRATEGIC_AND_PROJECTS: 'งานยุทธศาสตร์และแผนงานโครงการ',
  FINANCE_GROUP: 'กลุ่มงานการเงิน',
  HUMAN_RESOURCES: 'งานทรัพยากรบุคคล',
  NURSING_GROUP: 'กลุ่มการพยาบาล',
  SECRETARIAT: 'งานเลขานุการ',
  DIGITAL_HEALTH_MISSION: 'กลุ่มภารกิจสุขภาพดิจิทัล',
  SUPPLY_GROUP: 'กลุ่มงานพัสดุ',
}

const statusColorMap = {
  SENT: 'bg-red-100 text-red-800',       // ส่ง = แดง
  RECEIVED: 'bg-yellow-100 text-yellow-800', // รับ = เหลือง
  COMPLETED: 'bg-green-100 text-green-800',  // เสร็จ = เขียว
}

export default function FolderQRCode() {
  const { folderId } = useParams()
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userId = user.id || null

  const [folder, setFolder] = useState(null)
  const [documents, setDocuments] = useState([])
  const [status, setStatus] = useState('')
  const [loadingFolder, setLoadingFolder] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [error, setError] = useState(null)

  const [agencies, setAgencies] = useState([])
  const [agenciesSelected, setAgenciesSelected] = useState([])
  const [notes, setNotes] = useState('')

  const [statusDepartment, setStatusDepartment] = useState('')

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
        setStatus(data.status || '')
        setStatusDepartment(data.statusLogs[0]?.department || '')
        setNotes(data.statusLogs[0]?.remark || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoadingFolder(false)
      }
    }
    fetchFolder()
  }, [folderId, token, navigate])

  useEffect(() => {
    if (!folder?.id) return
    async function fetchDocuments() {
      try {
        setLoadingDocs(true)
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/documents/by-folder/?folderId=${folder.id}`,
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

  useEffect(() => {
    async function fetchAgencies() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/folders`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลหน่วยงานได้')
        const data = await res.json()
        setAgencies(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchAgencies()
  }, [token])

  const toggleAgency = (id) => {
    setAgenciesSelected((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!folder?.id) {
      Swal.fire('ไม่พบแฟ้มนี้', '', 'error')
      return
    }
    if (!userId) {
      Swal.fire('กรุณาเข้าสู่ระบบใหม่', '', 'warning')
      return
    }

    if (!statusDepartment) {
      Swal.fire('กรุณาเลือกหน่วยงานปลายทาง', '', 'warning')
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/folders/${folder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          userId,
          department: statusDepartment,
          remark: notes,
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'อัปเดตสถานะแฟ้มล้มเหลว')
      }

      await Swal.fire('อัปเดตสถานะแฟ้มสำเร็จ', '', 'success')

      window.location.reload()
    } catch (err) {
      Swal.fire('เกิดข้อผิดพลาด', err.message, 'error')
    }
  }

const renderStatusHistory = () => {
  const statusLogs = folder?.statusLogs || []
  if (statusLogs.length === 0)
    return <p className="italic text-gray-400">ไม่มีประวัติสถานะ</p>

  // แสดงเฉพาะ 5 รายการล่าสุด และใส่ scroll ถ้ามากกว่านั้น
  const latestLogs = statusLogs
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, 5)

  return (
    <ul className="space-y-4 text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto">
      {latestLogs.map((log) => {
        const departmentName = log.department
          ? departmentMap[log.department] || log.department
          : '-'

        return (
          <li key={log.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="mb-2">
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                  statusColorMap[log.status] || 'bg-gray-200 text-gray-700'
                }`}
              >
                {statusMap[log.status] || log.status}
              </span>
            </div>
            <div>
              เมื่อ:{' '}
              {new Date(log.startedAt).toLocaleString(undefined, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </div>
            <div>หน่วยงาน: {departmentName}</div>
            <div>โดย: {log.user?.name || '-'}</div>
            <div>หมายเหตุ: {log.remark || '-'}</div>
          </li>
        )
      })}
    </ul>
  )
}


  if (loadingFolder || loadingDocs) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-100 to-white">
        <div className="text-blue-600 text-xl font-semibold animate-pulse">
          กำลังโหลดข้อมูล...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6 rounded-lg mx-auto max-w-lg">
        <p className="text-red-700 text-lg font-semibold mb-4">
          เกิดข้อผิดพลาด: {error}
        </p>
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
    <main className="min-h-screen bg-gradient-to-tr from-blue-50 to-white py-10 px-4 flex justify-center">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl p-8 space-y-10">
        <h1 className="text-4xl font-bold text-center text-blue-800">
          {folder.title}
        </h1>

        {/* เลือกสถานะ */}
        <section>
          <h2 className="text-lg font-medium text-gray-700 mb-2">สถานะของแฟ้ม</h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(statusMap).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-gray-800">
                <input
                  type="radio"
                  name="status"
                  value={key}
                  checked={status === key}
                  onChange={(e) => setStatus(e.target.value)}
                  className="cursor-pointer w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* เลือกหน่วยงานปลายทาง */}
        <section className="w-full">
          <h2 className="text-lg font-medium text-gray-700 mb-3">เลือกหน่วยงานปลายทาง</h2>
          <div className="border border-gray-300 rounded-xl p-4 space-y-3 bg-gray-50">
            {Object.entries(departmentMap).length === 0 ? (
              <p className="text-gray-500 italic">ไม่มีหน่วยงานให้เลือก</p>
            ) : (
              Object.entries(departmentMap).map(([key, name]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer text-gray-800 hover:bg-white p-2 rounded-md transition"
                >
                  <input
                    type="radio"
                    name="department"
                    value={key}
                    checked={statusDepartment === key}
                    onChange={(e) => setStatusDepartment(e.target.value)}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-base">{name}</span>
                </label>
              ))
            )}
          </div>
        </section>

        {/* หมายเหตุ */}
        <section>
          <h2 className="text-lg font-medium text-gray-700 mb-2">หมายเหตุเพิ่มเติม</h2>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ระบุหมายเหตุเพิ่มเติม..."
            className="w-full p-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </section>

        {/* ปุ่มบันทึก */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg transition hover:scale-105"
          >
            ✅ บันทึกสถานะแฟ้ม
          </button>
        </div>

        {/* ลิงก์กลับ */}
        <div className="text-center">
          <Link
            to="/documents"
            className="cursor-pointer text-blue-600 hover:underline hover:text-blue-800"
          >
            ⬅️ กลับไปเพิ่มแฟ้มใหม่
          </Link>
        </div>

        {/* ประวัติสถานะ */}
        <section>
          <h2 className="text-lg font-medium text-gray-700 mb-3">ประวัติการอัปเดตสถานะ</h2>
          {renderStatusHistory()}
        </section>
      </div>
    </main>
  )
}
