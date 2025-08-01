import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userName, setUserName] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const userObj = JSON.parse(userData)
          setUserName(userObj.name || null)
        } catch {
          setUserName(null)
        }
      } else {
        setUserName(null)
      }
    }

    // โหลดตอน mount
    loadUser()

    // ฟัง event 'userChanged' เพื่อโหลด user ใหม่
    window.addEventListener('userChanged', loadUser)

    // ล้าง listener ตอน unmount
    return () => {
      window.removeEventListener('userChanged', loadUser)
    }
  }, [])


  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')

    // แจ้ง event userChanged ด้วย
    window.dispatchEvent(new Event('userChanged'))

    navigate('/login')
  }


return (
  <nav className="bg-gray-800 z-50 relative">
    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div className="relative flex h-16 items-center justify-between">
        {/* Mobile menu button */}
        <div className="flex items-center sm:hidden">
          <button
            type="button"
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 cursor-pointer hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset"
          >
            <span className="sr-only">Open main menu</span>
            {!mobileMenuOpen ? (
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            ) : (
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
          
        </div>

        {/* Logo */}
        <div className="flex shrink-0 items-center">
          <Link to="/" tabIndex={0}>
            <img
              src="https://img2.pic.in.th/pic/Digital_health_logo.jpeg"
              alt="Your Company"
              className="h-8 w-auto cursor-pointer"
            />
          </Link>
        </div>

{/* Desktop Menu */}
<div className="hidden sm:flex flex-1 justify-start">  {/* เปลี่ยนจาก justify-center เป็น justify-start */}
  <div className="flex space-x-4">
    <Link
      to="/documents"
      aria-current="page"
      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
      tabIndex={0}
    >
      แฟ้มเอกสาร
    </Link>
    <Link
      to="/documents/create"
      aria-current="page"
      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
      tabIndex={0}
    >
      เพิ่มแฟ้มเอกสาร
    </Link>
    <Link
      to="/users"
      className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
      tabIndex={0}
    >
      ผู้ใช้งานทั้งหมด
    </Link>
  </div>
</div>


        {/* User Info */}
        <div className="flex items-center space-x-4">
          {userName ? (
            <>
              <span className="text-white select-none">สวัสดี, {userName}</span>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-600 text-sm font-semibold cursor-pointer"
                tabIndex={0}
                aria-label="Logout"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-600 text-sm font-semibold cursor-pointer"
              tabIndex={0}
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </div>

    {/* Mobile menu, show/hide based on menu state */}
    {mobileMenuOpen && (
      <div id="mobile-menu" className="sm:hidden" role="menu" aria-label="Mobile menu">
        <div className="space-y-1 px-2 pt-2 pb-3">
          <Link
            to="/documents"
            className="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            tabIndex={0}
            role="menuitem"
          >
            แฟ้มเอกสาร
          </Link>
          <Link
            to="/documents/create"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            tabIndex={0}
            role="menuitem"
          >
            เพิ่มแฟ้มเอกสาร
          </Link>
          <Link
            to="/users"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            tabIndex={0}
            role="menuitem"
          >
            ผู้ใช้งานทั้งหมด
          </Link>
          <div className="border-t border-gray-700 mt-2 pt-2">
            {userName ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-500 hover:bg-red-700 hover:text-white cursor-pointer"
                tabIndex={0}
                role="menuitem"
              >
                ออกจากระบบ
              </button>
            ) : (
              <Link
                to="/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-blue-400 hover:bg-blue-600 hover:text-white cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
                tabIndex={0}
                role="menuitem"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </div>
    )}
  </nav>
)

}
