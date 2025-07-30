import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const statusMap = {
  SENT: "ส่งแฟ้ม",
  RECEIVED: "รับแฟ้ม",
  COMPLETED: "เสร็จสิ้น",
  ARCHIVED: "เก็บประวัติ",
};

export default function ArchiveFolders() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [archivedFolders, setArchivedFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState(null);

  // โหลดแฟ้มที่สถานะ COMPLETED (ครั้งเดียว)
useEffect(() => {
  if (!token) {
    Swal.fire({
      icon: "warning",
      title: "กรุณาเข้าสู่ระบบ",
      confirmButtonText: "ตกลง",
    }).then(() => {
      navigate("/login");
    });
    return;
  }// รอจนกว่า token จะมีค่า

async function fetchArchivedFolders() {
  try {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const res = await fetch(`${baseUrl}/api/folders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลแฟ้มเก็บประวัติได้");
    const data = await res.json();
    const archivedOnly = data.filter((folder) => folder.status === "COMPLETED");
    setArchivedFolders(archivedOnly);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

fetchArchivedFolders();

}, [token]);

  // โหลดเอกสารของแฟ้มที่เลือก
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


  if (loading)
    return (
      <div className="text-center py-10 text-blue-600 font-semibold animate-pulse">
        กำลังโหลดแฟ้มเก็บประวัติ...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-10 text-red-600 font-semibold">
        เกิดข้อผิดพลาด: {error}
      </div>
    );

  // ถ้าโหลดเสร็จแล้วแต่ไม่มีแฟ้มเก็บประวัติเลย ให้ไม่แสดงอะไรเลย
  if (!loading && archivedFolders.length === 0) {
    return null;
  }

return (
  <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-10 px-4 sm:px-8 lg:px-16 font-sans">
    <h1 className="text-5xl font-extrabold text-center text-blue-700 dark:text-blue-400 mb-12 drop-shadow-lg">
      📁 แฟ้มเก็บประวัติ (Archived Folders)
    </h1>

    <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto">
      {/* Sidebar: รายการแฟ้ม */}
      <aside className="md:w-1/3 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 max-h-[600px] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">รายการแฟ้ม</h2>
        <ul className="space-y-2">
          {archivedFolders.map((folder) => (
            <li
              key={folder.id}
              onClick={() => setSelectedFolder(folder)}
              className={`cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:scale-[1.02] border border-gray-300 dark:border-gray-700
                ${
                  selectedFolder?.id === folder.id
                    ? 'bg-blue-100 text-blue-800 font-semibold dark:bg-blue-900 dark:text-blue-300'
                    : 'hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
            >
              {folder.title}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content: รายละเอียดแฟ้ม */}
      <section className="md:w-2/3 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 overflow-auto max-h-[600px]">
        {!selectedFolder ? (
          <p className="text-gray-500 text-center text-lg italic">กรุณาเลือกแฟ้มเพื่อดูเอกสาร</p>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">{selectedFolder.title}</h2>
            <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
              สถานะ:{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {statusMap[selectedFolder.status]}
              </span>
            </p>

            {loadingDocs ? (
              <p className="text-blue-600 dark:text-blue-300 font-semibold animate-pulse text-center">
                กำลังโหลดเอกสาร...
              </p>
            ) : documents.length === 0 ? (
              <p className="text-gray-500 italic text-center">ไม่มีเอกสารในแฟ้มนี้</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-700 shadow-md">
                <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  <thead className="bg-blue-600 text-white dark:bg-blue-800">
                    <tr>
                      <th className="px-4 py-3 text-left">เลขที่เอกสาร</th>
                      <th className="px-4 py-3 text-left">เรื่อง</th>
                      <th className="px-4 py-3 text-left">ประเภท</th>
                      <th className="px-4 py-3 text-left">วันที่สร้าง</th>
                      <th className="px-4 py-3 text-left">ผู้สร้าง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-blue-50 dark:hover:bg-gray-800 transition cursor-pointer"
                      >
                        <td className="px-4 py-2">{doc.docNumber || '-'}</td>
                        <td className="px-4 py-2">{doc.subject || '-'}</td>
                        <td className="px-4 py-2">{doc.agencyType || '-'}</td>
                        <td className="px-4 py-2">
                          {doc.createdAt
                            ? new Date(doc.createdAt).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-4 py-2">{doc.createdBy?.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  </main>
)

}
