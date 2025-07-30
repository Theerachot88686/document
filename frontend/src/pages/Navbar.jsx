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
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              type="button"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 cursor-pointer hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <Link to="/" tabIndex={0}>
                <img
                  src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                  alt="Your Company"
                  className="h-8 w-auto cursor-pointer"
                />
              </Link>
            </div>

            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                <Link
                  to="/documents"
                  aria-current="page"
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white cursor-pointer"
                  tabIndex={0}
                >
                  แฟ้มเอกสาร
                </Link>

                <Link
                  to="/archived"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                  tabIndex={0}
                >
                  ประวัติแฟ้ม
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
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Notification Button (optional) */}
            <button
              type="button"
              className="relative rounded-full bg-gray-800 p-1 text-gray-400 cursor-pointer hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
              aria-label="View notifications"
              tabIndex={0}
            >
              <span className="sr-only">View notifications</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </button>

            {/* Profile dropdown */}
            <div className="relative ml-3 flex items-center gap-2">
              {userName ? (
                <>
                  <span className="text-white mr-4 select-none">สวัสดี, {userName}</span>
                  <button
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-600 text-sm font-semibold cursor-pointer"
                    tabIndex={0}
                    aria-label="Logout"
                  >
                    Logout
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
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="sm:hidden" role="menu" aria-label="Mobile menu">
          <div className="space-y-1 px-2 pt-2 pb-3">
            <Link
              to="/"
              className="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={0}
              role="menuitem"
            >
              Dashboard
            </Link>
            <Link
              to="/team"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={0}
              role="menuitem"
            >
              Team
            </Link>
            <Link
              to="/projects"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={0}
              role="menuitem"
            >
              Projects
            </Link>
            <Link
              to="/calendar"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={0}
              role="menuitem"
            >
              Calendar
            </Link>
            <div className="border-t border-gray-700 mt-2 pt-2">
              {userName ? (
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-500 hover:bg-red-700 hover:text-white cursor-pointer"
                  tabIndex={0}
                  role="menuitem"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-blue-400 hover:bg-blue-600 hover:text-white cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                  tabIndex={0}
                  role="menuitem"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
