import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './pages/Navbar'
import Login from './pages/Login'
import HomePage from './pages/HomePage'
import DocumentList from './pages/DocumentList'
import CreateDocument from './pages/CreateDocument'
import Register from './pages/Register'
import FolderQRCode from './pages/qrcode'
import UserManagement from './pages/user'
import ARCHIVED from './pages/ArchiveFolders'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/documents" element={<DocumentList />} />
        <Route path="/documents/create" element={<CreateDocument />} />
        <Route path="/register" element={<Register />} />
        <Route path="/qrcode/:folderId" element={<FolderQRCode />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/archived" element={<ARCHIVED />} />
      </Routes>
    </>
  )
}
