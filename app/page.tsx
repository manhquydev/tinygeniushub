import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Cùng Con Tự Học
          </h1>
          <p className="text-xl text-gray-600">
            Hệ thống giáo dục trực tuyến - Chương trình Abeka
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-blue-800 mb-3">
              📚 Chương Trình Học
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Mầm Non (K4-K5)</li>
              <li>• Tiểu Học (Lớp 1-5)</li>
              <li>• Trung Học (Lớp 6-9)</li>
              <li>• THPT (Lớp 10-12)</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-green-800 mb-3">
              🎓 Tính Năng
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• 20,195+ video bài giảng</li>
              <li>• Hệ thống gói học linh hoạt</li>
              <li>• Theo dõi tiến độ học tập</li>
              <li>• Huy hiệu & phần thưởng</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🔌 API Endpoints
          </h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <code className="bg-gray-100 px-3 py-2 rounded">GET /api/abeka/packages</code>
            <code className="bg-gray-100 px-3 py-2 rounded">GET /api/abeka/curriculum/grades</code>
            <code className="bg-gray-100 px-3 py-2 rounded">GET /api/abeka/curriculum/subjects</code>
            <code className="bg-gray-100 px-3 py-2 rounded">GET /api/abeka/curriculum/lessons</code>
            <code className="bg-gray-100 px-3 py-2 rounded">GET /api/abeka/videos/accessible</code>
            <code className="bg-gray-100 px-3 py-2 rounded">GET /api/curriculum/badges</code>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            © 2026 Cùng Con Tự Học. Hệ thống đang hoạt động.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            API Server: Online | Videos: 20,195+ | Packages: 8
          </p>
        </div>
      </div>
    </div>
  );
}
