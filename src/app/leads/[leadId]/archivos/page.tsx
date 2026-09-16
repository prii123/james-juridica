'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import FileViewerModal from '@/components/FileViewerModal'
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  Eye,
  Calendar,
  User,
  Search,
  Filter,
  FolderOpen
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Alert, Spinner } from '@/components/ui'

interface Archivo {
  id: string
  nombreOriginal: string
  nombreArchivo: string
  tamano: number
  tipoMime: string
  url: string
  fechaSubida: string
  subidoPor: {
    id: string
    nombre: string
    apellido: string
  }
}

interface Lead {
  id: string
  nombre: string
  email: string
}

export default function ArchivosLeadPage() {
  const params = useParams()
  const leadId = params.leadId as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [error, setError] = useState('')

  // Estados para el modal de visualización
  const [showModal, setShowModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<Archivo | null>(null)

  useEffect(() => {
    fetchLeadInfo()
    fetchArchivos()
  }, [])

  const fetchLeadInfo = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}`)
      if (response.ok) {
        const data = await response.json()
        setLead(data)
      }
    } catch (error) {
      console.error('Error al cargar información del lead:', error)
    }
  }

  const fetchArchivos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterType) params.append('type', filterType)

      const response = await fetch(`/api/leads/${leadId}/archivos?${params}`)
      if (response.ok) {
        const data = await response.json()
        setArchivos(data.archivos || [])
      } else {
        setError('No se pudieron cargar los archivos')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      setError('')

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`/api/leads/${leadId}/archivos`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al subir archivo')
        }
      }

      // Recargar la lista de archivos
      await fetchArchivos()

      // Limpiar el input
      event.target.value = ''

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al subir archivos')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (archivoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) return

    try {
      const response = await fetch(`/api/leads/${leadId}/archivos/${archivoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setArchivos(archivos.filter(archivo => archivo.id !== archivoId))
      } else {
        setError('No se pudo eliminar el archivo')
      }
    } catch (error) {
      setError('Error al eliminar archivo')
    }
  }

  const handleViewFile = (archivo: Archivo) => {
    setSelectedFile(archivo)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedFile(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (tipoMime: string) => {
    if (tipoMime.startsWith('image/')) return '🖼️'
    if (tipoMime.includes('pdf')) return '📄'
    if (tipoMime.includes('word')) return '📝'
    if (tipoMime.includes('excel') || tipoMime.includes('sheet')) return '📊'
    return '📁'
  }

  const filteredArchivos = archivos.filter(archivo => {
    const matchSearch = archivo.nombreOriginal.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === '' || archivo.tipoMime.includes(filterType)
    return matchSearch && matchType
  })

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Leads', href: '/leads' },
          { label: lead?.nombre || 'Lead', href: `/leads/${leadId}` },
          { label: 'Archivos' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href={`/leads/${leadId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-800">
            <FolderOpen size={24} />
            Archivos de {lead?.nombre}
          </h1>
          <p className="mb-0 text-slate-500">
            Gestiona todos los documentos y archivos del cliente
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">{error}</Alert>
      )}

      {/* Subir archivos */}
      <Card className="mb-4">
        <CardBody>
          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h6 className="mb-1 font-semibold text-slate-800">Subir nuevos archivos</h6>
              <p className="mb-0 text-sm text-slate-500">
                Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF (Máximo 10MB por archivo)
              </p>
            </div>
            <div className="w-full md:w-auto">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900">
                {uploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Subir archivos
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Filtros */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                className="pl-9"
                placeholder="Buscar archivos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Select
                className="pl-9"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="pdf">PDF</option>
                <option value="word">Word</option>
                <option value="excel">Excel</option>
                <option value="image">Imágenes</option>
              </Select>
            </div>
            <div className="text-sm text-slate-500">
              Total: {filteredArchivos.length} archivo{filteredArchivos.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de archivos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <Spinner />
          ) : filteredArchivos.length === 0 ? (
            <div className="py-5 text-center">
              <FolderOpen size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">No hay archivos</h5>
              <p className="text-slate-500">
                {search || filterType
                  ? 'No se encontraron archivos con los criterios de búsqueda.'
                  : 'Aún no se han subido archivos para este cliente.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Archivo</th>
                    <th className="px-4 py-3 font-semibold">Tamaño</th>
                    <th className="px-4 py-3 font-semibold">Fecha de subida</th>
                    <th className="px-4 py-3 font-semibold">Subido por</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArchivos.map((archivo) => (
                    <tr key={archivo.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getFileIcon(archivo.tipoMime)}</span>
                          <div>
                            <div className="font-semibold text-slate-800">{archivo.nombreOriginal}</div>
                            <div className="text-xs text-slate-500">{archivo.tipoMime}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-500">
                        {formatFileSize(archivo.tamano)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar size={14} />
                          {formatDate(archivo.fechaSubida)}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <User size={14} />
                          {archivo.subidoPor.nombre} {archivo.subidoPor.apellido}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex gap-1">
                          <Button variant="outlinePrimary" size="icon" onClick={() => handleViewFile(archivo)} title="Vista previa">
                            <Eye size={14} />
                          </Button>
                          <a href={archivo.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="border-teal-700 text-teal-700 hover:bg-teal-50" title="Descargar archivo">
                              <Download size={14} />
                            </Button>
                          </a>
                          <Button variant="outlineDanger" size="icon" onClick={() => handleDeleteFile(archivo.id)} title="Eliminar">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de visualización de archivos */}
      <FileViewerModal
        isOpen={showModal}
        onClose={handleCloseModal}
        archivo={selectedFile}
      />
    </>
  )
}
