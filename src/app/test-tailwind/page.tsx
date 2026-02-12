export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Test Tailwind CSS</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg text-center">
          RED
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg text-center">
          GREEN  
        </div>
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg text-center">
          BLUE
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Si ves colores y estilos, Tailwind funciona ✅</h2>
        <button className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-3 rounded-full font-medium hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105">
          Botón con gradiente y hover
        </button>
      </div>
    </div>
  )
}