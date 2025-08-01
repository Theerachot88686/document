import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'


const statusMap = {
  SENT: 'ส่งแฟ้ม',
  RECEIVED: 'รับแฟ้ม',
  COMPLETED: 'เสร็จสิ้น',
  ARCHIVED: 'เริ่มต้น',
}

const statusColorMap = {
  SENT: 'bg-red-100 text-red-800', // ส่ง = แดง
  RECEIVED: 'bg-yellow-100 text-yellow-800', // รับ = เหลือง
  COMPLETED: 'bg-green-100 text-green-800', // เสร็จ = เขียว
}

const statusColorChart = {
  SENT: '#EF4444', // แดง
  RECEIVED: '#FACC15', // เหลือง
  COMPLETED: '#10B981', // เขียว
  ARCHIVED: '#9CA3AF', // เทา สำหรับสถานะอื่น ๆ
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

// สร้างข้อมูลสำหรับกราฟ สรุปจำนวนแต่ละสถานะ
const getStatusDataForChart = (folders = []) => {
  const counts = folders.reduce((acc, folder) => {
    folder.statusLogs?.forEach((log) => {
      acc[log.status] = (acc[log.status] || 0) + 1
    })
    return acc
  }, {})

  return Object.entries(counts).map(([status, count]) => ({
    status,
    statusLabel: statusMap[status] || status,
    count,
  }))
}

const ITEMS_PER_PAGE = 10

export default function Dashboard() {
  const [folders, setFolders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('asc')

  const token = localStorage.getItem('token')

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const compare = (a, b) => {
    let valA, valB
    switch (sortKey) {
      case 'createdAt':
        valA = new Date(a.createdAt)
        valB = new Date(b.createdAt)
        break
      case 'title':
        valA = a.title?.toLowerCase() || ''
        valB = b.title?.toLowerCase() || ''
        break
      case 'changerName':
        valA = a.statusLogs?.[0]?.user?.name?.toLowerCase() || ''
        valB = b.statusLogs?.[0]?.user?.name?.toLowerCase() || ''
        break
      case 'department':
        valA = a.statusLogs?.[0]?.department || ''
        valB = b.statusLogs?.[0]?.department || ''
        break
      case 'status':
        valA = a.status || ''
        valB = b.status || ''
        break
      case 'remark':
        valA = a.statusLogs?.[0]?.remark || ''
        valB = b.statusLogs?.[0]?.remark || ''
        break
      default:
        valA = ''
        valB = ''
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  }

  const sortedFolders = [...folders].sort(compare)

  const renderSortArrow = (key) => {
    if (sortKey !== key) return null
    return sortOrder === 'asc' ? ' ▲' : ' ▼'
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      try {
        const resFolders = await fetch(`${baseUrl}/api/folders`, { headers })
        if (!resFolders.ok) throw new Error('โหลดข้อมูลแฟ้มล้มเหลว')
        const foldersData = await resFolders.json()
        setFolders(foldersData)
        setCurrentPage(1)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  const filteredFolders = sortedFolders.filter((folder) => {
    return statusFilter ? folder.status === statusFilter : true
  })

  const totalPages = Math.ceil(filteredFolders.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayedFolders = filteredFolders.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading)
return (
  <div className="flex items-center justify-center py-20">
    <p className="text-xl font-semibold text-gray-700 flex space-x-1">
      <span>กำลังโหลดข้อมูล</span>
      <span className="flex space-x-1">
        <span className="animate-bounce [animation-delay:.1s]">.</span>
        <span className="animate-bounce [animation-delay:.2s]">.</span>
        <span className="animate-bounce [animation-delay:.3s]">.</span>
      </span>
    </p>
  </div>
);


  if (error)
    return <p className="text-red-500 text-center py-10">{error}</p>

  return (
    <div className="p-4 sm:p-10 bg-gradient-to-b from-blue-50 to-white min-h-screen dark:from-gray-900 dark:to-gray-800">


      {/* Chart */}
      {folders.length > 0 && (
        <div className="mb-8 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 text-center">
            สถานะที่มีการเปลี่ยนแปลงทั้งหมด
          </h2>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={getStatusDataForChart(folders)}
                dataKey="count"
                nameKey="statusLabel"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {getStatusDataForChart(folders).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={statusColorChart[entry.status] || '#9CA3AF'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}


      {/* Filter */}
      <div className="mb-4 sm:mb-3 flex">
        <div className="relative w-full max-w-xs sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="block w-full appearance-none px-3 py-1.5 sm:px-3 sm:py-2 bg-white border border-blue-300 rounded-md shadow-sm text-sm text-gray-700 dark:text-gray-200 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- เลือกสถานะ --</option>
            {Object.entries(statusMap).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ตาราง */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-xl dark:bg-gray-900">
        <table className="min-w-[700px] w-full table-auto text-sm text-gray-700 dark:text-gray-200">
          <thead className="bg-blue-200 dark:bg-blue-800 text-gray-800 dark:text-white">
            <tr>
              <th className="p-3 text-left">ดู</th>
              <th
                className="p-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort('status')}
                title="สถานะ"
              >
                สถานะ{renderSortArrow('status')}
              </th>
              <th
                className="p-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort('department')}
                title="หน่วยงาน"
              >
                หน่วยงาน{renderSortArrow('department')}
              </th>
              <th
                className="p-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort('changerName')}
                title="ผู้สร้าง"
              >
                ผู้สร้าง{renderSortArrow('changerName')}
              </th>
              <th
                className="p-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort('remark')}
                title="หมายเหตุ"
              >
                หมายเหตุ{renderSortArrow('remark')}
              </th>
              <th
                className="p-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort('title')}
                title="ชื่อแฟ้ม"
              >
                ชื่อแฟ้ม{renderSortArrow('title')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedFolders.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-6 text-gray-500 dark:text-gray-400"
                >
                  ไม่มีแฟ้มตามเงื่อนไข
                </td>
              </tr>
            ) : (
              displayedFolders.map((folder) => {
                const latestLog = folder.statusLogs?.[0]
                const changerName = latestLog?.user?.name || '-'
                const departmentName =
                  departmentMap[latestLog?.department] ||
                  latestLog?.department ||
                  '-'
                const statusText = statusMap[folder.status] || folder.status
                const startedAt = latestLog?.startedAt
                  ? new Date(latestLog.startedAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                  : '-'

                return (
                  <tr
                    key={folder.id}
                    className="border-b last:border-b-0 hover:bg-blue-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="p-3" data-label="ดู">
                      <Link
                        to={`/qrcode/${folder.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        เปิด
                      </Link>
                    </td>
                    <td className="p-3" data-label="สถานะ">
                      <div
                        className={`font-semibold text-xs inline-block px-2 py-0.5 rounded-full ${statusColorMap[folder.status] ||
                          'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {statusText}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">{startedAt}</div>
                    </td>

                    <td className="p-3" data-label="หน่วยงาน">
                      {departmentName}
                    </td>
                    <td className="p-3" data-label="ผู้สร้าง">
                      {changerName}
                    </td>
                    <td className="p-3" data-label="หมายเหตุ">
                      {latestLog?.remark || '-'}
                    </td>
                    <td className="p-3" data-label="ชื่อแฟ้ม">
                      {folder.title || '-'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md border ${currentPage === 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-white hover:bg-blue-100'
              }`}
          >
            ก่อนหน้า
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md border ${page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-blue-100'
                }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md border ${currentPage === totalPages
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-white hover:bg-blue-100'
              }`}
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  )
}
