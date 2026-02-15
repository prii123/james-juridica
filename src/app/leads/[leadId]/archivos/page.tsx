'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import FileViewerModal from '@/components/FileViewerModal'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  Calendar,
  User,
  Search,
  Filter,
  FolderOpen
} from 'lucide-react'

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

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href={`/leads/${leadId}`} className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <h1 className="h3 fw-bold text-dark mb-1">
            <FolderOpen size={24} className="me-2" />
            Archivos de {lead?.nombre}
          </h1>
          <p className="text-secondary mb-0">
            Gestiona todos los documentos y archivos del cliente
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Subir archivos */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h6 className="mb-2">Subir nuevos archivos</h6>
              <p className="text-muted small mb-0">
                Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF (Máximo 10MB por archivo)
              </p>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <input
                  type="file"
                  className="form-control"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <button 
                  className="btn btn-primary" 
                  type="button"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="me-2" />
                      Subir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar archivos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <Filter size={16} />
                </span>
                <select
                  className="form-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  <option value="pdf">PDF</option>
                  <option value="word">Word</option>
                  <option value="excel">Excel</option>
                  <option value="image">Imágenes</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-muted small">
                Total: {filteredArchivos.length} archivo{filteredArchivos.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de archivos */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Documentos</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : filteredArchivos.length === 0 ? (
            <div className="text-center py-5">
              <FolderOpen size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No hay archivos</h5>
              <p className="text-muted">
                {search || filterType 
                  ? 'No se encontraron archivos con los criterios de búsqueda.'
                  : 'Aún no se han subido archivos para este cliente.'
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Tamaño</th>
                    <th>Fecha de subida</th>
                    <th>Subido por</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchivos.map((archivo) => (
                    <tr key={archivo.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-4">{getFileIcon(archivo.tipoMime)}</span>
                          <div>
                            <div className="fw-semibold">{archivo.nombreOriginal}</div>
                            <div className="text-muted small">{archivo.tipoMime}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted small">
                          {formatFileSize(archivo.tamano)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 text-muted small">
                          <Calendar size={14} />
                          {formatDate(archivo.fechaSubida)}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 text-muted small">
                          <User size={14} />
                          {archivo.subidoPor.nombre} {archivo.subidoPor.apellido}
                        </div>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            onClick={() => handleViewFile(archivo)}
                            className="btn btn-outline-primary btn-sm"
                            title="Vista previa"
                          >
                            <Eye size={14} />
                          </button>
                          <a
                            href={archivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-success btn-sm"
                            title="Descargar archivo"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(archivo.id)}
                            className="btn btn-outline-danger btn-sm"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de visualización de archivos */}
      <FileViewerModal 
        isOpen={showModal}
        onClose={handleCloseModal}
        archivo={selectedFile}
      />
    </>
  )
}