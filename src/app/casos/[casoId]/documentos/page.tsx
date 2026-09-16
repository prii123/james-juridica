'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
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
  Edit3
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Select, Label, Alert, Spinner, Modal, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

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

const TIPO_ICONS: Record<Documento['tipo'], typeof FileText> = {
  PDF: FileText,
  DOCX: FileText,
  XLSX: FileText,
  JPG: Image,
  PNG: Image,
  MP4: Video,
  ZIP: Archive,
  OTROS: File
}

const TIPO_BADGE: Record<Documento['tipo'], BadgeProps['variant']> = {
  PDF: 'danger',
  DOCX: 'primary',
  XLSX: 'success',
  JPG: 'warning',
  PNG: 'warning',
  MP4: 'info',
  ZIP: 'secondary',
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

const ESTADO_CONFIG: Record<Documento['estado'], { badge: BadgeProps['variant']; icon: typeof CheckCircle; label: string }> = {
  ACTIVO: { badge: 'success', icon: CheckCircle, label: 'Activo' },
  ARCHIVADO: { badge: 'secondary', icon: Archive, label: 'Archivado' },
  VENCIDO: { badge: 'danger', icon: AlertCircle, label: 'Vencido' },
}

export default function DocumentosPage() {
  const params = useParams()
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
    return <Spinner />
  }

  if (error || !caso) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">{error || 'Caso no encontrado'}</Alert>
        <Link href="/casos"><Button>Volver a Casos</Button></Link>
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

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/casos/${casoId}`}>
            <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="mb-0 text-xl font-bold text-slate-800">Documentos</h1>
            <p className="mb-0 text-slate-500">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>

        <Button onClick={() => setShowUploadModal(true)}>
          <Upload size={16} />
          Subir Documentos
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <Card className="bg-slate-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-slate-800">{estadisticas.total}</div>
            <small className="text-slate-500">Total</small>
          </CardBody>
        </Card>
        <Card className="bg-teal-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-teal-700">{estadisticas.activos}</div>
            <small className="text-slate-500">Activos</small>
          </CardBody>
        </Card>
        <Card className="bg-amber-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-amber-600">{estadisticas.proximosVencer}</div>
            <small className="text-slate-500">Por vencer</small>
          </CardBody>
        </Card>
        <Card className="bg-slate-100 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-slate-600">{estadisticas.archivados}</div>
            <small className="text-slate-500">Archivados</small>
          </CardBody>
        </Card>
        <Card className="bg-red-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-red-600">{estadisticas.vencidos}</div>
            <small className="text-slate-500">Vencidos</small>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label className="flex items-center gap-1"><Filter size={14} />Filtrar por Categoría</Label>
              <Select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                <option value="">Todas las categorías</option>
                {Object.entries(CATEGORIAS_DOCUMENTO).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label className="flex items-center gap-1"><FileText size={14} />Tipo</Label>
              <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Todos los tipos</option>
                <option value="PDF">PDF</option>
                <option value="DOCX">Word</option>
                <option value="XLSX">Excel</option>
                <option value="JPG">Imagen JPG</option>
                <option value="PNG">Imagen PNG</option>
                <option value="MP4">Video</option>
                <option value="ZIP">Archivo</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Estado</Label>
              <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="ARCHIVADO">Archivado</option>
                <option value="VENCIDO">Vencido</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => { setFiltroCategoria(''); setFiltroTipo(''); setFiltroEstado('') }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader><CardTitle>Documentos ({documentosFiltrados.length})</CardTitle></CardHeader>
        <CardBody>
          {documentosFiltrados.length === 0 ? (
            <div className="py-5 text-center">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">No hay documentos</h5>
              <p className="mb-3 text-slate-500">
                {documentos.length === 0
                  ? 'Aún no se han subido documentos para este caso.'
                  : 'No se encontraron documentos con los filtros seleccionados.'
                }
              </p>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload size={16} />
                Subir Primer Documento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Documento</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Tamaño</th>
                    <th className="px-4 py-3 font-semibold">Subido</th>
                    <th className="px-4 py-3 font-semibold">Vencimiento</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documentosFiltrados.map((documento) => {
                    const IconoTipo = TIPO_ICONS[documento.tipo] || File
                    const badgeTipo = TIPO_BADGE[documento.tipo] || 'secondary'
                    const estadoConfig = ESTADO_CONFIG[documento.estado] || ESTADO_CONFIG.ACTIVO
                    const IconoEstado = estadoConfig.icon
                    const proximoVencer = isExpiringSoon(documento.fechaVencimiento)
                    const vencido = isExpired(documento.fechaVencimiento)

                    return (
                      <tr key={documento.id} className={cn(vencido ? 'bg-red-50' : proximoVencer ? 'bg-amber-50' : 'hover:bg-slate-50')}>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <Badge variant={badgeTipo} className="flex h-8 w-8 items-center justify-center rounded-full p-0">
                              <IconoTipo size={16} />
                            </Badge>
                            <div>
                              <div className="font-medium text-slate-800">{documento.nombre}</div>
                              {documento.descripcion && (
                                <small className="block text-slate-500">
                                  {documento.descripcion.length > 40
                                    ? `${documento.descripcion.substring(0, 40)}...`
                                    : documento.descripcion
                                  }
                                </small>
                              )}
                              <small className="text-slate-500">
                                v{documento.version} • {documento.tipo}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant="outline">
                            {CATEGORIAS_DOCUMENTO[documento.categoria as keyof typeof CATEGORIAS_DOCUMENTO] || documento.categoria}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={estadoConfig.badge}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </Badge>
                          {proximoVencer && !vencido && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                              <Clock size={12} />
                              Vence pronto
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <small>{formatFileSize(documento.tamaño)}</small>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div><small>{formatDate(documento.fechaSubida)}</small></div>
                          <div><small className="text-slate-500">{documento.subidoPor.nombre} {documento.subidoPor.apellido}</small></div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {documento.fechaVencimiento ? (
                            <small className={cn(vencido ? 'font-bold text-red-600' : proximoVencer ? 'text-amber-600' : 'text-slate-500')}>
                              {formatDate(documento.fechaVencimiento)}
                              {vencido && (
                                <div className="mt-1 flex items-center gap-1 text-red-600">
                                  <AlertCircle size={12} />
                                  Vencido
                                </div>
                              )}
                            </small>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex gap-1">
                            <Button variant="outlinePrimary" size="icon" onClick={() => handleDownload(documento)} title="Ver/Descargar">
                              <Eye size={14} />
                            </Button>
                            <Button variant="outline" size="icon" className="border-teal-700 text-teal-700 hover:bg-teal-50" onClick={() => handleDownload(documento)} title="Descargar">
                              <Download size={14} />
                            </Button>
                            <Link href={`/casos/${casoId}/documentos/${documento.id}/editar`}>
                              <Button variant="outline" size="icon" title="Editar">
                                <Edit3 size={14} />
                              </Button>
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
        </CardBody>
      </Card>

      {/* Modal de Subida */}
      {showUploadModal && (
        <Modal
          onClose={() => setShowUploadModal(false)}
          title="Subir Documentos"
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancelar</Button>
              <Button loading={uploading}>
                {!uploading && <Upload size={16} />}
                {uploading ? 'Subiendo...' : 'Subir Documentos'}
              </Button>
            </>
          }
        >
          <div className="py-4 text-center">
            <Upload size={48} className="mx-auto mb-3 text-slate-300" />
            <h5 className="font-semibold text-slate-800">Selecciona archivos para subir</h5>
            <p className="mb-3 text-slate-500">
              Arrastra y suelta archivos aquí o haz clic para seleccionar
            </p>
            <input
              type="file"
              multiple
              className="block w-full rounded-lg border border-slate-300 text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-900"
              onChange={handleFileUpload}
              accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.mp4,.zip,.rar"
            />
            <small className="mt-2 block text-slate-500">
              Tipos permitidos: PDF, Word, Excel, Imágenes, Videos, Archivos comprimidos
            </small>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Categoría *</Label>
              <Select required>
                <option value="">Selecciona una categoría</option>
                {Object.entries(CATEGORIAS_DOCUMENTO).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <input type="date" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20" />
            </div>
          </div>
          <div className="mt-3">
            <Label>Descripción</Label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              rows={3}
              placeholder="Descripción opcional del documento..."
            />
          </div>
        </Modal>
      )}
    </>
  )
}
