'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Download,
  Eye,
  Upload,
  Filter,
  File,
  Image,
  Video,
  Archive,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Edit3
} from 'lucide-react'

interface Documento {
  id: string
  nombre: string
  tipo: 'PDF' | 'DOCX' | 'XLSX' | 'JPG' | 'PNG' | 'MP4' | 'ZIP' | 'OTROS'
  categoria: string
  descripcion?: string
  tamaño: number
  fechaSubida: string
  fechaVencimiento?: string
  estado: 'ACTIVO' | 'ARCHIVADO' | 'VENCIDO'
  version: number
  url: string
  subidoPor: {
    id: string
    nombre: string
    apellido: string
  }
}

interface Caso {
  id: string
  numeroCaso: string
  cliente: {
    nombre: string
    apellido?: string
  }
}

const TIPO_ICONS = {
  PDF: FileText,
  DOCX: FileText,
  XLSX: FileText,
  JPG: Image,
  PNG: Image,
  MP4: Video,
  ZIP: Archive,
  OTROS: File
}

const TIPO_COLORS = {
  PDF: 'danger',
  DOCX: 'primary',
  XLSX: 'success',
  JPG: 'warning',
  PNG: 'warning',
  MP4: 'info',
  ZIP: 'dark',
  OTROS: 'secondary'
}

const CATEGORIAS_DOCUMENTO = {
  'DEMANDA': 'Demanda',
  'CONTESTACION': 'Contestación',
  'PODER': 'Poder',
  'IDENTIFICACION': 'Identificación',
  'FINANCIEROS': 'Estados Financieros',
  'INVENTARIO': 'Inventario',
  'ACREEDORES': 'Relación de Acreedores',
  'CONTRATOS': 'Contratos',
  'PROVIDENCIAS': 'Providencias Judiciales',
  'ACTAS': 'Actas',
  'CORRESPONDENCIA': 'Correspondencia',
  'OTROS': 'Otros'
}

const ESTADO_CONFIG = {
  ACTIVO: {
    color: 'success',
    icon: CheckCircle,
    label: 'Activo'
  },
  ARCHIVADO: {
    color: 'secondary',
    icon: Archive,
    label: 'Archivado'
  },
  VENCIDO: {
    color: 'danger',
    icon: AlertCircle,
    label: 'Vencido'
  }
}

export default function DocumentosPage() {
  const params = useParams()
  const router = useRouter()
  const casoId = params.casoId as string
  
  const [caso, setCaso] = useState<Caso | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [casoId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener información del caso
      const casoResponse = await fetch(`/api/casos/${casoId}`)
      if (casoResponse.ok) {
        const casoData = await casoResponse.json()
        setCaso(casoData)
      }

      // Obtener documentos (API endpoint que necesitamos crear)
      const documentosResponse = await fetch(`/api/casos/${casoId}/documentos`)
      if (documentosResponse.ok) {
        const documentosData = await documentosResponse.json()
        setDocumentos(documentosData)
      } else {
        // Por ahora, datos mock hasta que tengamos el endpoint
        setDocumentos([])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isExpiringSoon = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    const vencimiento = new Date(fechaVencimiento)
    const hoy = new Date()
    const diffTime = vencimiento.getTime() - hoy.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const isExpired = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    return new Date(fechaVencimiento) < new Date()
  }

  const documentosFiltrados = documentos.filter(documento => {
    const matchCategoria = !filtroCategoria || documento.categoria === filtroCategoria
    const matchTipo = !filtroTipo || documento.tipo === filtroTipo
    const matchEstado = !filtroEstado || documento.estado === filtroEstado
    return matchCategoria && matchTipo && matchEstado
  })

  const estadisticas = {
    total: documentos.length,
    activos: documentos.filter(d => d.estado === 'ACTIVO').length,
    archivados: documentos.filter(d => d.estado === 'ARCHIVADO').length,
    vencidos: documentos.filter(d => d.estado === 'VENCIDO').length,
    proximosVencer: documentos.filter(d => 
      d.estado === 'ACTIVO' && isExpiringSoon(d.fechaVencimiento)
    ).length
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Esta funcionalidad necesita implementación del API
    console.log('Archivos para subir:', files)
    // TODO: Implementar subida de archivos
  }

  const handleDownload = async (documento: Documento) => {
    try {
      window.open(documento.url, '_blank')
    } catch (error) {
      console.error('Error al descargar documento:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (error || !caso) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Caso no encontrado'}
        </div>
        <Link href="/casos" className="btn btn-primary">
          Volver a Casos
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Casos', href: '/casos' },
          { label: caso.numeroCaso, href: `/casos/${casoId}` },
          { label: 'Documentos' }
        ]} 
      />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href={`/casos/${casoId}`} className="btn btn-outline-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h3 fw-bold text-dark mb-0">Documentos</h1>
            <p className="text-secondary mb-0">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <Upload size={16} />
          Subir Documentos
        </button>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-2 col-sm-6">
          <div className="card bg-light text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-dark">{estadisticas.total}</div>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-success bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-success">{estadisticas.activos}</div>
              <small className="text-muted">Activos</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-warning bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-warning">{estadisticas.proximosVencer}</div>
              <small className="text-muted">Por vencer</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-secondary bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-secondary">{estadisticas.archivados}</div>
              <small className="text-muted">Archivados</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-danger bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-danger">{estadisticas.vencidos}</div>
              <small className="text-muted">Vencidos</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">
                <Filter size={14} className="me-1" />
                Filtrar por Categoría
              </label>
              <select 
                className="form-select"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {Object.entries(CATEGORIAS_DOCUMENTO).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">
                <FileText size={14} className="me-1" />
                Tipo
              </label>
              <select 
                className="form-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="PDF">PDF</option>
                <option value="DOCX">Word</option>
                <option value="XLSX">Excel</option>
                <option value="JPG">Imagen JPG</option>
                <option value="PNG">Imagen PNG</option>
                <option value="MP4">Video</option>
                <option value="ZIP">Archivo</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">
                Estado
              </label>
              <select 
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="ARCHIVADO">Archivado</option>
                <option value="VENCIDO">Vencido</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFiltroCategoria('')
                  setFiltroTipo('')
                  setFiltroEstado('')
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Documentos */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Documentos ({documentosFiltrados.length})
          </h5>
        </div>
        <div className="card-body">
          {documentosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No hay documentos</h5>
              <p className="text-secondary">
                {documentos.length === 0 
                  ? 'Aún no se han subido documentos para este caso.'
                  : 'No se encontraron documentos con los filtros seleccionados.'
                }
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary"
              >
                <Upload size={16} className="me-2" />
                Subir Primer Documento
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Tamaño</th>
                    <th>Subido</th>
                    <th>Vencimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {documentosFiltrados.map((documento) => {
                    const IconoTipo = TIPO_ICONS[documento.tipo] || File
                    const colorTipo = TIPO_COLORS[documento.tipo] || 'secondary'
                    const estadoConfig = ESTADO_CONFIG[documento.estado] || ESTADO_CONFIG.ACTIVO
                    const IconoEstado = estadoConfig.icon
                    const proximoVencer = isExpiringSoon(documento.fechaVencimiento)
                    const vencido = isExpired(documento.fechaVencimiento)
                    
                    return (
                      <tr key={documento.id} className={vencido ? 'table-danger' : proximoVencer ? 'table-warning' : ''}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge bg-${colorTipo} d-flex align-items-center justify-content-center`} style={{width: '32px', height: '32px'}}>
                              <IconoTipo size={16} />
                            </span>
                            <div>
                              <div className="fw-medium">{documento.nombre}</div>
                              {documento.descripcion && (
                                <small className="text-muted d-block">
                                  {documento.descripcion.length > 40 
                                    ? `${documento.descripcion.substring(0, 40)}...`
                                    : documento.descripcion
                                  }
                                </small>
                              )}
                              <small className="text-muted">
                                v{documento.version} • {documento.tipo}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {CATEGORIAS_DOCUMENTO[documento.categoria as keyof typeof CATEGORIAS_DOCUMENTO] || documento.categoria}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`} style={{width: 'fit-content'}}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </span>
                          {proximoVencer && !vencido && (
                            <div>
                              <small className="text-warning">
                                <Clock size={12} className="me-1" />
                                Vence pronto
                              </small>
                            </div>
                          )}
                        </td>
                        <td>
                          <small>{formatFileSize(documento.tamaño)}</small>
                        </td>
                        <td>
                          <div>
                            <small>{formatDate(documento.fechaSubida)}</small>
                          </div>
                          <div>
                            <small className="text-muted">
                              {documento.subidoPor.nombre} {documento.subidoPor.apellido}
                            </small>
                          </div>
                        </td>
                        <td>
                          {documento.fechaVencimiento ? (
                            <small className={vencido ? 'text-danger fw-bold' : proximoVencer ? 'text-warning' : 'text-muted'}>
                              {formatDate(documento.fechaVencimiento)}
                              {vencido && (
                                <div className="text-danger small">
                                  <AlertCircle size={12} className="me-1" />
                                  Vencido
                                </div>
                              )}
                            </small>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              onClick={() => handleDownload(documento)}
                              className="btn btn-outline-primary"
                              title="Ver/Descargar"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDownload(documento)}
                              className="btn btn-outline-success"
                              title="Descargar"
                            >
                              <Download size={14} />
                            </button>
                            <Link
                              href={`/casos/${casoId}/documentos/${documento.id}/editar`}
                              className="btn btn-outline-secondary"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Subida */}
      {showUploadModal && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Subir Documentos</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowUploadModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center py-4">
                  <Upload size={48} className="text-muted mb-3" />
                  <h5>Selecciona archivos para subir</h5>
                  <p className="text-muted">
                    Arrastra y suelta archivos aquí o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    multiple
                    className="form-control"
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.mp4,.zip,.rar"
                  />
                  <small className="text-muted mt-2 d-block">
                    Tipos permitidos: PDF, Word, Excel, Imágenes, Videos, Archivos comprimidos
                  </small>
                </div>
                
                <div className="mt-4">
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Categoría *</label>
                      <select className="form-select" required>
                        <option value="">Selecciona una categoría</option>
                        {Object.entries(CATEGORIAS_DOCUMENTO).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Fecha de Vencimiento</label>
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="form-label">Descripción</label>
                    <textarea 
                      className="form-control" 
                      rows={3}
                      placeholder="Descripción opcional del documento..."
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="me-2" />
                      Subir Documentos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}