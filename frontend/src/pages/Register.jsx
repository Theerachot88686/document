import { useState } from 'react'
import Swal from 'sweetalert2'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'user',
    agree: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.agree) {
      setError('คุณต้องยอมรับนโยบายความเป็นส่วนตัวก่อนจึงจะสามารถสมัครสมาชิกได้')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
          role: formData.role,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'ไม่สามารถสมัครสมาชิกได้')
      }

      await Swal.fire({
        icon: 'success',
        title: 'สมัครสมาชิกสำเร็จ!',
        text: 'กำลังพาไปยังหน้าล็อกอิน...',
        showConfirmButton: false,
        timer: 2000,
      })

      window.location.href = '/login'

      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'user',
        agree: false,
      })
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="isolate bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          สมัครสมาชิก
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          กรุณากรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งาน
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-xl sm:mt-20">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
              ชื่อหน่วยงาน / ชื่อผู้ใช้
            </label>
            <div className="mt-2.5">
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-900">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="mt-2.5">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
              รหัสผ่าน
            </label>
            <div className="mt-2.5">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
              />
            </div>
          </div>

          <div className="flex gap-x-4 items-center">
            <input
              id="agree"
              name="agree"
              type="checkbox"
              checked={formData.agree}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              required
            />
            <label htmlFor="agree" className="text-sm text-gray-600">
              ฉันยอมรับ{' '}
              <a href="#" className="font-semibold text-indigo-600">
                นโยบายความเป็นส่วนตัว
              </a>
            </label>
          </div>
        </div>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        <div className="mt-10">
          <button
            type="submit"
            disabled={loading}
            className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'กำลังโหลด...' : 'สมัครสมาชิก'}
          </button>
        </div>
      </form>
    </div>
  )
}
