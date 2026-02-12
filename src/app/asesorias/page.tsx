import Breadcrumb from '@/components/Breadcrumb'
import { Scale } from 'lucide-react'

export default function AsesoriaPage() {
  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Asesorías' }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Asesorías</h1>
            <p className="text-slate-600">Gestión de asesorías y consultas jurídicas</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-2.5 rounded-xl shadow-sm font-medium transition-all duration-200 transform hover:scale-105">
              Nueva Asesoría
            </button>
            <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl shadow-sm font-medium transition-all duration-200">
              Programar Cita
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lista de Asesorías</h2>
              <p className="text-sm text-slate-500 mt-1">Consultas y asesorías jurídicas realizadas</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">8</span> pendientes esta semana
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <Scale className="h-10 w-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Sistema en construcción</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Las funcionalidades de asesorías estarán disponibles próximamente. Podrás gestionar todas las consultas jurídicas desde aquí.
            </p>
            <div className="mt-8">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200">
                Agendar consulta
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}