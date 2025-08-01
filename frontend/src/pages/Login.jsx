import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'เข้าสู่ระบบล้มเหลว')
      }

      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      window.dispatchEvent(new Event('userChanged'))
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

return (
  <div className="flex justify-center bg-gray-50 px-4 py-12 min-h-[85vh] items-start mt-10">

    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <img
          className="mx-auto h-20 w-auto" // เพิ่มขนาดโลโก้ให้ใหญ่ขึ้น
          src="https://img2.pic.in.th/pic/Digital_health_logo.jpeg"
          alt="โลโก้"
        />
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
          เข้าสู่ระบบ
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            ชื่อผู้ใช้
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            รหัสผ่าน
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-gray-500">
        ยังไม่มีบัญชี?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  </div>
)

}
