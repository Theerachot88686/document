import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { FiTrash2, FiEdit, FiPlus, FiSearch, FiX, FiFolder, FiFileText } from "react-icons/fi";

export default function FolderListAndDocuments() {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [searchFolder, setSearchFolder] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);
  const [showFolderForm, setShowFolderForm] = useState(false);


  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user")) || null;

  // Dark mode toggle state
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  // ฟังก์ชันหาเวลาอัปเดตสถานะล่าสุดจาก folder.statusLogs
  function getStatusUpdatedAt(folder) {
    if (!folder || !folder.statusLogs || folder.statusLogs.length === 0) return null;

    // หา log ที่สถานะยังไม่สิ้นสุด (endedAt === null)
    const currentStatusLog = folder.statusLogs.find(log => log.endedAt === null);
    if (currentStatusLog) return currentStatusLog.startedAt;

    // ถ้าไม่มีสถานะปัจจุบัน ให้หา log ล่าสุด
    const sortedLogs = [...folder.statusLogs].sort(
      (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
    );

    return sortedLogs.length > 0 ? sortedLogs[0].startedAt : null;
  }


function getStatusColor(status) {
  switch (status) {
    case 'SENT':
      return 'text-red-600 dark:text-red-400'      // ส่ง = แดง
    case 'RECEIVED':
      return 'text-yellow-600 dark:text-yellow-400' // รับ = เหลือง
    case 'COMPLETED':
      return 'text-green-600 dark:text-green-400'  // เสร็จ = เขียว
    case 'ARCHIVED':
      return 'text-gray-600 dark:text-gray-400'
    default:
      return 'text-gray-800 dark:text-gray-300'
  }
}


  function FolderEditForm({ folder, onClose, onSave, currentUser }) {
    const [formData, setFormData] = useState({
      title: folder?.title || "",
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title.trim()) {
        Swal.fire("กรุณากรอกชื่อแฟ้ม", "", "warning");
        return;
      }
      // ส่งข้อมูลเป็นออบเจกต์เดียว รวม id กับ formData
      onSave({ id: folder.id, ...formData });
    };

    return (
      <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              แก้ไขชื่อแฟ้ม
            </h3>
            <button
              onClick={onClose}
              className="cursor-pointer text-red-500 text-2xl hover:text-red-600 transition-colors"
            >
              <FiX />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                ชื่อแฟ้ม
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                placeholder="กรอกชื่อแฟ้มใหม่"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                type="button"
                className="cursor-pointer px-5 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-700 transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="cursor-pointer px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const handleSaveEditedFolder = async (updatedFolder) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/folders/${updatedFolder.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedFolder),
        }
      );

      if (!res.ok) throw new Error("ไม่สามารถบันทึกการแก้ไขได้");

      const result = await res.json();

      setFolders((prev) =>
        prev.map((f) => (f.id === result.id ? result : f))
      );

      Swal.fire("สำเร็จ", "แก้ไขแฟ้มเรียบร้อยแล้ว", "success");
      setShowFolderForm(false);
      setEditingFolder(null);
    } catch (err) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด", err.message || "ไม่สามารถแก้ไขได้", "error");
    }
  };

function printQRCode(folderId) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const folderUrl = `${window.location.origin}/qrcode/${folderId}`;

  const canvasHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>พิมพ์ QR Code</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: white;
        }
        .card {
          width: 646px;
          height: 408px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        canvas {
          width: 240px !important;
          height: 240px !important;
        }
        @media print {
          body {
            height: auto;
          }
          .card {
            width: 646px;
            height: 408px;
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <canvas id="qr-canvas"></canvas>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
      <script>
        const canvas = document.getElementById('qr-canvas');
        const url = ${JSON.stringify(folderUrl)};
        QRCode.toCanvas(canvas, url, { width: 240 }, function (error) {
          if (error) {
            document.body.innerHTML = '<p>ไม่สามารถสร้าง QR Code ได้</p>';
          } else {
            setTimeout(() => window.print(), 300);
          }
        });
      </script>
    </body>
  </html>
  `;

  printWindow.document.write(canvasHtml);
  printWindow.document.close();
}





  // Fetch folders
  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'คุณต้องล็อกอินก่อนใช้งานหน้านี้',
        confirmButtonText: 'ตกลง',
        allowOutsideClick: false,
      }).then(() => {
        navigate('/login')
      })
      return
    }

    async function fetchFolders() {
      try {
        setLoadingFolders(true);
        setError(null);
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${baseUrl}/api/folders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลแฟ้มได้");
        const data = await res.json();
        setFolders(data);
        if (data.length > 0) {
          setSelectedFolder(data[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingFolders(false);
      }
    }
    fetchFolders();

  }, [token]);

  // Fetch documents when folder selected
  useEffect(() => {
    if (!selectedFolder) return;

    async function fetchDocuments() {
      setLoadingDocs(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        const res = await fetch(
          `${baseUrl}/api/documents/by-folder/?folderId=${selectedFolder.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลเอกสารในแฟ้มนี้ได้");
        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingDocs(false);
      }
    }

    fetchDocuments();
  }, [selectedFolder, token]);




  // Filtered folders by search
  const filteredFolders = folders.filter((f) =>
    f.title.toLowerCase().includes(searchFolder.toLowerCase())
  );

  // Folder click handler
  const handleFolderClick = (folder) => {
    if (folder.id === selectedFolder?.id) return;
    setSelectedFolder(folder);
    setShowDocForm(false);
    setEditingDoc(null);
  };

  // Add document handler
  const handleAddDocument = () => {
    setEditingDoc(null);
    setShowDocForm(true);
  };

  // Edit document handler
  const handleEditDocument = (doc) => {
    setEditingDoc(doc);
    setShowDocForm(true);
  };

  const handleDeleteFolder = async (folderId) => {
    const confirmed = await Swal.fire({
      title: "คุณแน่ใจหรือไม่ว่าจะลบแฟ้มนี้?",
      text: "การลบแฟ้มจะลบเอกสารทั้งหมดภายในแฟ้มนี้ด้วย",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบเลย",
      cancelButtonText: "ยกเลิก",
    });

    if (!confirmed.isConfirmed) return;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/folders/${folderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "ลบแฟ้มไม่สำเร็จ");
      }

      Swal.fire("ลบสำเร็จ", "แฟ้มถูกลบเรียบร้อยแล้ว", "success");

      // อัพเดต state ลบแฟ้มที่ถูกลบออก
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    } catch (err) {
      Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
    }
  };


  // Delete document handler
  const handleDeleteDocument = async (docId) => {
    const confirmed = await Swal.fire({
      title: "คุณแน่ใจหรือไม่ว่าจะลบเอกสารนี้?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบเลย",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirmed.isConfirmed) return;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      const res = await fetch(`${baseUrl}/api/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("ลบเอกสารล้มเหลว");

      Swal.fire("ลบเอกสารสำเร็จ", "", "success");

      const updatedDocs = documents.filter((doc) => doc.id !== docId);
      setDocuments(updatedDocs);
    } catch (err) {
      Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
    }
  };


  const statusMap = {
    SENT: 'ส่งแฟ้ม',
    RECEIVED: 'รับแฟ้ม',
    COMPLETED: 'เสร็จสิ้น',
    ARCHIVED: 'เริ่มต้น',
  }

  const departments = [
    "งานยุทธศาสตร์และแผนงานโครงการ",
    "กลุ่มงานการเงิน",
    "งานทรัพยากรบุคคล",
    "กลุ่มการพยาบาล",
    "งานเลขานุการ",
    "กลุ่มภารกิจสุขภาพดิจิทัล",
    "กลุ่มงานพัสดุ"
  ];


  // Document form component
  function DocumentForm({ onClose, onSave, doc, departments, currentUser, documentTypes }) {
    const [formData, setFormData] = useState({
      docNumber: doc?.docNumber || "",
      subject: doc?.subject || "",
      sender: doc?.sender || "",
      agencyType: doc?.agencyType || "",
      department: doc?.department || "",
      createdAt: doc?.createdAt
        ? new Date(doc.createdAt).toISOString().substring(0, 10)
        : new Date().toISOString().substring(0, 10),
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.docNumber.trim() || !formData.subject.trim()) {
        Swal.fire("กรุณากรอกข้อมูลที่จำเป็น", "", "warning");
        return;
      }
      onSave(formData);
    };

    return (
      <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-6">

        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xl max-h-[90vh] overflow-auto animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-700">
              {doc ? "แก้ไขเอกสาร" : "เพิ่มเอกสารใหม่"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 text-2xl"
              aria-label="ปิดฟอร์ม"
              title="ปิด"
            >
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                เลขที่เอกสาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="docNumber"
                value={formData.docNumber}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="กรอกเลขที่เอกสาร"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                เรื่อง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="กรอกเรื่องเอกสาร"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                ประเภทเอกสาร
              </label>
              <select
                name="agencyType"
                value={formData.agencyType}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                required
              >
                <option value="">-- เลือกประเภทเอกสาร --</option>
                <option value="หนังสือราชการ-เข้า">หนังสือราชการ-เข้า</option>
                <option value="หนังสือราชการ-ออก">หนังสือราชการ-ออก</option>
                <option value="บันทึกข้อความ-เข้า">บันทึกข้อความ-เข้า</option>
                <option value="หนังสือเวียน">หนังสือเวียน</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                ส่งโดย
              </label>
              <input
                type="text"
                name="sender"
                value={formData.sender}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300 "
                placeholder="ชื่อผู้ส่ง"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                หน่วยงานปลายทาง
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className=" w-full rounded-md border border-gray-300 px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
              >
                <option value="">-- เลือกหน่วยงานปลายทาง --</option>
                {departments?.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  วันที่สร้าง
                </label>
                <input
                  type="date"
                  name="createdAt"
                  value={formData.createdAt}
                  readOnly
                  className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 mt-1 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ผู้สร้าง
                </label>
                <input
                  type="text"
                  value={currentUser?.name || doc?.createdBy?.name || ""}
                  readOnly
                  className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 mt-1 text-gray-600"
                />
              </div>
            </div>



            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }



  const statuses = Object.entries(statusMap).map(([value, label]) => ({ value, label }));

  // Save document (add/edit)
  const saveDocument = async (data) => {
    try {
      const { createdAt, filePath, ...restData } = data;

      const payload = {
        ...restData,
        folderId: selectedFolder?.id,
        createdById: currentUser?.id,
        agencyType: restData.agencyType || "",
      };

      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      const url = editingDoc
        ? `${baseUrl}/api/documents/${editingDoc.id}`
        : `${baseUrl}/api/documents`;

      const method = editingDoc ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || (editingDoc ? "แก้ไขเอกสารล้มเหลว" : "เพิ่มเอกสารล้มเหลว"));
      }

      Swal.fire("บันทึกสำเร็จ", "", "success");

      // ดึงข้อมูลเอกสารใหม่
      const updatedRes = await fetch(`${baseUrl}/api/documents?folderId=${selectedFolder?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!updatedRes.ok) throw new Error("ดึงข้อมูลเอกสารไม่สำเร็จ");

      const updatedDocs = await updatedRes.json();
      setDocuments(updatedDocs);

      setShowDocForm(false);
      setEditingDoc(null);
    } catch (err) {
      Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
    }
  };


  return (
    <div className={`${darkMode ? "dark" : ""} min-h-screen transition-colors duration-700 font-sans bg-gradient-to-tr from-blue-50 to-white dark:from-gray-900 dark:to-gray-800`}>
      <div className="max-w-7xl mx-auto p-6 sm:p-10">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-extrabold text-blue-700 dark:text-blue-400 drop-shadow-lg select-none">
            📁 แฟ้มเอกสาร &amp; 📄 เอกสาร
          </h1>

        </header>

        {/* Search */}
        <div className="mb-6 flex items-center max-w-sm">
          <FiSearch className="text-xl text-gray-500 dark:text-gray-400 mr-2" />
          <input
            type="search"
            placeholder="ค้นหาแฟ้มเอกสาร..."
            className="flex-grow border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={searchFolder}
            onChange={(e) => setSearchFolder(e.target.value)}
          />
          {searchFolder && (
            <button
              onClick={() => setSearchFolder("")}
              className="ml-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition"
              aria-label="Clear search"
            >
              <FiX className="text-xl" />
            </button>
          )}
        </div>

        {/* Folder List Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-extrabold mb-6 text-gray-800 dark:text-gray-200 flex items-center gap-3 select-none">
            <FiFolder className="text-4xl text-blue-600 dark:text-blue-400" />
            แฟ้มเอกสาร
          </h2>

          {/* Loading / Error / Empty States */}
          {loadingFolders ? (
            <p className="text-gray-500 dark:text-gray-400 animate-pulse select-none text-center py-10">
              กำลังโหลดแฟ้มเอกสาร...
            </p>
          ) : error ? (
            <p className="text-red-600 font-semibold select-none text-center py-10">{error}</p>
          ) : filteredFolders.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 select-none text-center py-10">
              ไม่มีแฟ้มเอกสาร
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredFolders.map((folder) => {
                const statusUpdatedAt = getStatusUpdatedAt(folder);
                const isSelected = selectedFolder?.id === folder.id;

                return (
                  <li
                    key={folder.id}
                    onClick={() => handleFolderClick(folder)}
                    title={folder.title}
                    className={`cursor-pointer group relative rounded-xl border bg-white dark:bg-gray-900 
              border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-transform 
              duration-300 transform hover:scale-105 p-6 flex flex-col justify-between select-none 
              ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400 shadow-lg" : ""}
            `}
                  >
                    {/* Title & Status */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 truncate drop-shadow-md">
                        {folder.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-800 dark:text-gray-300">
                        สถานะ: <span className={`font-semibold ${getStatusColor(folder.status)}`}>
                          {statusMap[folder.status] || folder.status || "-"}
                        </span>
                      </p>

                      {statusUpdatedAt ? (
                        <p className="text-xs text-gray-500 italic mt-1">
                          อัปเดตสถานะล่าสุด: {new Date(statusUpdatedAt).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic mt-1">
                          ไม่มีข้อมูลเวลาอัปเดตสถานะ
                        </p>
                      )}
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center mb-4 relative">
                      {folder.qrToken ? (
                        <>
                          <Link to={`/qrcode/${folder.id}`}>
                            <QRCodeCanvas
                              value={`${window.location.origin}/qrcode/${folder.id}`}
                              size={120}
                              className="border border-gray-300 dark:border-gray-700 rounded-md bg-white"
                            />
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              printQRCode(folder.id);
                            }}
                            title="พิมพ์ QR Code"
                            className="mt-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 
                      hover:bg-green-200 dark:hover:bg-green-800 rounded-md px-4 py-1 font-semibold 
                      flex items-center gap-2 shadow-md cursor-pointer select-none"
                          >
                            🖨️ พิมพ์
                          </button>
                        </>
                      ) : (
                        <p className="italic text-gray-400 dark:text-gray-500 text-center w-full">
                          ไม่มี QR Code
                        </p>
                      )}
                    </div>

                    {/* Action Buttons (Edit & Delete) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder(folder);
                        setShowFolderForm(true);
                      }}
                      title="แก้ไขแฟ้ม"
                      className="absolute top-3 right-20 opacity-0 group-hover:opacity-100 transition-opacity 
                duration-300 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 
                hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-md px-3 py-1 font-semibold 
                flex items-center gap-1 shadow-md cursor-pointer select-none"
                    >
                      <FiEdit className="w-5 h-5" />
                      แก้ไข
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      title="ลบแฟ้ม"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity 
                duration-300 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 
                hover:bg-red-200 dark:hover:bg-red-800 rounded-md px-3 py-1 font-semibold 
                flex items-center gap-1 shadow-md cursor-pointer select-none"
                    >
                      <FiTrash2 className="w-5 h-5" />
                      ลบ
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Folder Edit Form Modal */}
        {showFolderForm && editingFolder && (
          <FolderEditForm
            folder={editingFolder}
            onClose={() => {
              setShowFolderForm(false);
              setEditingFolder(null);
            }}
            onSave={handleSaveEditedFolder}
            currentUser={currentUser}
          />
        )}



        {/* Documents in Selected Folder */}
        {/*{selectedFolder && (
          <section className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2">
                <FiFileText /> เอกสารในแฟ้ม: {selectedFolder.title}
              </h2>

              <button
                onClick={handleAddDocument}
                className="cursor-pointer flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold rounded-full px-6 py-3 shadow-lg transition active:scale-95"
              >
                <FiPlus /> เพิ่มเอกสาร
              </button>
            </div>

            {loadingDocs ? (
              <p className="text-gray-600 dark:text-gray-400 animate-pulse">กำลังโหลดเอกสาร...</p>
            ) : documents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">ไม่มีเอกสารในแฟ้มนี้</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-700 shadow-lg">
                <table className="w-full text-left text-gray-700 dark:text-gray-300">
                  <thead className="bg-blue-700 dark:bg-blue-800 text-white">
                    <tr>
                      <th className="p-4">เลขที่เอกสาร</th>
                      <th className="p-4">เรื่อง</th>
                      <th className="p-4">ประเภท</th>
                      <th className="p-4">ส่งโดย</th>
                      <th className="p-4">วันที่สร้าง</th>
                      <th className="p-4">ผู้สร้าง</th>
                      <th className="p-4">หน่วยงานปลายทาง</th>
                      <th className="p-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        <td className="p-4 truncate max-w-[120px]">{doc.docNumber}</td>
                        <td className="p-4 truncate max-w-[280px]">{doc.subject}</td>
                        <td className="p-4 truncate max-w-[160px]">{doc.agencyType || "-"}</td>
                        <td className="p-4 truncate max-w-[140px]">{doc.sender || "-"}</td>
                        <td className="p-4">{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 truncate max-w-[150px]">{doc.createdBy?.name || "-"}</td>
                        <td className="p-4 truncate max-w-[140px]">{doc.department || "-"}</td>
                        <td className="p-4 text-center space-x-2">
                          <button
                            onClick={() => handleEditDocument(doc)}
                            className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold rounded-md transition active:scale-95"
                            title="แก้ไขเอกสาร"
                          >
                            <FiEdit /> แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition active:scale-95"
                            title="ลบเอกสาร"
                          >
                            <FiTrash2 /> ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Document Form Modal */}
        {showDocForm && (
          <DocumentForm
            doc={editingDoc}
            onClose={() => {
              setShowDocForm(false);
              setEditingDoc(null);
            }}
            onSave={saveDocument}
            statuses={statuses}  // ประกาศตัวแปรนี้ก่อนแล้วส่ง
            departments={departments}
            currentUser={currentUser}
          />
        )}

        {/* Floating Action Button */}
        {!showDocForm && (
          <Link
            to="/documents/create"
            className="cursor-pointer fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-5xl transition active:scale-90"
            title="เพิ่มเอกสาร"
          >
            <FiPlus />
          </Link>
        )}
      </div>
    </div>
  )

}
