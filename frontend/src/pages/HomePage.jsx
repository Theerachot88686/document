import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const statusMap = {
  SENT: 'ส่งแฟ้ม',
  RECEIVED: 'รับแฟ้ม',
  COMPLETED: 'เสร็จสิ้น',
  ARCHIVED: 'เก็บประวัติ',
}

export default function Dashboard() {
  const [folderStatusData, setFolderStatusData] = useState([])
  const [userCount, setUserCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const navigate = useNavigate()
  const token = localStorage.getItem('token')

useEffect(() => {
  async function fetchData() {
    setLoading(true)
    setError(null)

    try {
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const baseUrl = import.meta.env.VITE_API_BASE_URL

      const resFolders = await fetch(`${baseUrl}/api/folders`, { headers })
      if (!resFolders.ok) throw new Error('ไม่สามารถดึงข้อมูลแฟ้มได้')
      const folders = await resFolders.json()

      const resUsers = await fetch(`${baseUrl}/api/users`, { headers })
      if (!resUsers.ok) throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้งานได้')
      const users = await resUsers.json()

      // นับจำนวนแฟ้มตามสถานะ
      const statusCount = {}
      folders.forEach(folder => {
        if (folder.status) {
          statusCount[folder.status] = (statusCount[folder.status] || 0) + 1
        }
      })

      const statusData = Object.entries(statusCount).map(([key, value]) => ({
        name: statusMap[key] || key,
        value,
      }))

      setFolderStatusData(statusData)
      setUserCount(users.length)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [token])



  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        กำลังโหลดข้อมูล...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600">
        <p>เกิดข้อผิดพลาด: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          ลองใหม่
        </button>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'] // เพิ่มสีแดงสำหรับสถานะใหม่ ๆ

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-10">
      <header className="mb-12 text-center">
        <h1 className="text-6xl font-extrabold text-blue-700 dark:text-blue-400">
          สรุปข้อมูลระบบ
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300 text-lg">
          จำนวนแฟ้มเอกสารแบ่งตามสถานะ และผู้ใช้งานทั้งหมดในระบบ
        </p>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 flex flex-col items-center">
          <h2 className="text-3xl font-semibold mb-6 text-gray-700 dark:text-gray-300">
            แฟ้มเอกสารแบ่งตามสถานะ
          </h2>

          {folderStatusData.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">ไม่มีข้อมูลแฟ้ม</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={folderStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {folderStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}

          <Link
            to="/folders"
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            ดูแฟ้มเอกสาร
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 flex flex-col items-center justify-center">
          <div className="text-green-600 dark:text-green-400 text-9xl font-bold select-none">
            {userCount}
          </div>
          <div className="mt-4 text-3xl font-semibold text-gray-700 dark:text-gray-300">
            ผู้ใช้งานทั้งหมด
          </div>
          <Link
            to="/users"
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
          >
            ดูผู้ใช้งาน
          </Link>
        </div>
      </main>
    </div>
  )
}
