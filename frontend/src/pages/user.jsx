import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    id: null,
    name: '',
    username: '',
    password: '',
    role: '',
  })
  const [isModalOpen, setIsModalOpen] = useState(false)

  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบ',
      }).then(() => {
        navigate('/login')
      })
      return
    }

    fetchUsers()
  }, [token, navigate])

async function fetchUsers() {
  setLoading(true)
  setError(null)

  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้งานได้')
    const data = await res.json()
    setUsers(data)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}


  function resetForm() {
    setForm({ id: null, name: '', username: '', password: '', role: '' })
    setIsModalOpen(false)
  }

  function handleInputChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

// 2. แก้ไข handleSubmit ให้ส่ง password เฉพาะเมื่อกรอกเท่านั้น
async function handleSubmit(e) {
  e.preventDefault()

  if (!form.name || !form.username || !form.role) {
    Swal.fire('ผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'error')
    return
  }

  try {
    // สร้าง object สำหรับส่งข้อมูล
    const updateData = {
      name: form.name,
      username: form.username,
      role: form.role,
    }
    // ถ้าผู้ใช้กรอกรหัสผ่านใหม่ ให้ส่งด้วย
    if (form.password.trim() !== '') {
      updateData.password = form.password
    }

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${form.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด')

    Swal.fire('สำเร็จ', data.message, 'success')
    resetForm()
    fetchUsers()
  } catch (err) {
    Swal.fire('ผิดพลาด', err.message, 'error')
  }
}


  function openEditModal(user) {
    setForm({
      id: user.id,
      name: user.name,
      username: user.username,
      password: '',
      role: user.role,
    })
    setIsModalOpen(true)
  }

  async function handleDelete(id) {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'เมื่อลบแล้วจะไม่สามารถกู้คืนได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    })
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด')
        Swal.fire('สำเร็จ', data.message, 'success')
        fetchUsers()
      } catch (err) {
        Swal.fire('ผิดพลาด', err.message, 'error')
      }
    }
  }

  if (loading) return <p className="text-center mt-10">กำลังโหลดข้อมูล...</p>
  if (error) return <p className="text-center mt-10 text-red-600">เกิดข้อผิดพลาด: {error}</p>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ตารางรายชื่อผู้ใช้งาน */}
<div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-5xl mx-auto">
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อผู้ใช้งาน</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บทบาท</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สร้าง</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลาสร้าง</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่แก้ไข</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลาแก้ไข</th>
        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {users.map(user => {
        const createdAt = new Date(user.createdAt)
        const updatedAt = new Date(user.updatedAt)
        return (
          <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {createdAt.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {createdAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {updatedAt.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {updatedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
              <button
                onClick={() => openEditModal(user)}
                className="cursor-pointer px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 text-white"
              >
                แก้ไข
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="cursor-pointer px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-white"
              >
                ลบ
              </button>
            </td>
          </tr>
        )
      })}
      {users.length === 0 && (
        <tr>
          <td colSpan="8" className="text-center py-4 text-gray-500">
            ไม่มีข้อมูลผู้ใช้งาน
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h2 className="text-2xl font-bold mb-4 text-center">แก้ไขผู้ใช้งาน</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold">ชื่อ</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">ชื่อผู้ใช้งาน</label>
                <input
                  name="username"
                  value={form.username}
                  disabled
                  className="w-full px-3 py-2 border rounded bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
  <label className="block mb-1 font-semibold">รหัสผ่านใหม่ (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</label>
  <input
    name="password"
    type="password"
    value={form.password}
    onChange={handleInputChange}
    className="w-full px-3 py-2 border rounded"
    placeholder="รหัสผ่านใหม่"
  />
</div>
              <div>
                <label className="block mb-1 font-semibold">บทบาท</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  className="cursor-pointer w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">-- เลือกบทบาท --</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="cursor-pointer px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className=" cursor-pointer px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  อัปเดตข้อมูล
                </button>
              </div>
            </form>

            {/* ปุ่มปิดมุมบนขวา */}
            <button
              onClick={resetForm}
              className="cursor-pointer absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
