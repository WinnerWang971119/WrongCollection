export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          錯題收集
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          WrongCollection - 學習路上的最佳夥伴
        </p>
        <div className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors cursor-pointer">
          立即開始
        </div>
      </div>
    </div>
  );
}
