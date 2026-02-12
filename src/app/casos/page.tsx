import Breadcrumb from '@/components/Breadcrumb'
import { Briefcase } from 'lucide-react'

export default function CasosPage() {
  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Casos' }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Casos Jurídicos</h1>
            <p className="text-slate-600">Gestión de procesos de insolvencia</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl shadow-sm font-medium transition-all duration-200 transform hover:scale-105">
              Nuevo Caso
            </button>
            <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl shadow-sm font-medium transition-all duration-200">
              Importar CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lista de Casos</h2>
              <p className="text-sm text-slate-500 mt-1">Todos los casos activos y archivados</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">24</span> casos activos
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <Briefcase className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Sistema en construcción</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Las funcionalidades de casos jurídicos estarán disponibles próximamente. Podrás gestionar todos los procesos de insolvencia desde aquí.
            </p>
            <div className="mt-8">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200">
                Solicitar demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}