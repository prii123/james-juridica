'use client'

import { useState, useEffect } from 'react'
import { X, Download, ExternalLink, FileText, Image } from 'lucide-react'

interface FileViewerModalProps {
  isOpen: boolean
  onClose: () => void
  archivo: {
    id: string
    nombreOriginal: string
    url: string
    tipoMime: string
    tamano: number
  } | null
}

export default function FileViewerModal({ isOpen, onClose, archivo }: FileViewerModalProps) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      // Simular carga del archivo
      const timer = setTimeout(() => setLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen, archivo])

  if (!isOpen || !archivo) return null

  const isPDF = archivo.tipoMime === 'application/pdf'
  const isImage = archivo.tipoMime.startsWith('image/')
  const isOfficeDoc = archivo.tipoMime.includes('word') || 
                      archivo.tipoMime.includes('excel') || 
                      archivo.tipoMime.includes('powerpoint') ||
                      archivo.tipoMime.includes('officedocument')

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex={-1} 
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={handleBackdropClick}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content" style={{ height: '90vh' }}>
          {/* Header */}
          <div className="modal-header border-bottom">
            <div className="d-flex align-items-center gap-3 flex-grow-1">
              <div>
                {isImage && <Image size={24} className="text-info" />}
                {isPDF && <FileText size={24} className="text-danger" />}
                {isOfficeDoc && <FileText size={24} className="text-primary" />}
                {!isImage && !isPDF && !isOfficeDoc && <FileText size={24} className="text-secondary" />}
              </div>
              <div>
                <h5 className="modal-title mb-0">{archivo.nombreOriginal}</h5>
                <small className="text-muted">
                  {archivo.tipoMime} • {formatFileSize(archivo.tamano)}
                </small>
              </div>
            </div>
            
            <div className="d-flex gap-2">
              {/* <a
                href={archivo.url}
                download={archivo.nombreOriginal}
                className="btn btn-outline-success btn-sm"
                title="Descargar archivo"
              >
                <Download size={16} className="me-1" />
                Descargar
              </a> */}
              <a
                href={archivo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink size={16} />
              </a>
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body p-0" style={{ height: 'calc(90vh - 120px)', overflow: 'hidden' }}>
            {loading ? (
              <div className="d-flex align-items-center justify-content-center h-100">
                <div className="text-center">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="text-muted">Cargando archivo...</p>
                </div>
              </div>
            ) : (
              <>
                {/* PDF Viewer */}
                {isPDF && (
                  <iframe
                    src={`${archivo.url}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
                    className="w-100 h-100"
                    style={{ border: 'none' }}
                    title={archivo.nombreOriginal}
                  />
                )}

                {/* Image Viewer */}
                {isImage && (
                  <div className="h-100 d-flex align-items-center justify-content-center p-3" style={{backgroundColor: '#f8f9fa'}}>
                    <img
                      src={archivo.url}
                      alt={archivo.nombreOriginal}
                      className="img-fluid"
                      style={{ 
                        maxHeight: '100%', 
                        maxWidth: '100%',
                        objectFit: 'contain',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                )}

                {/* Office Documents */}
                {isOfficeDoc && (
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(archivo.url)}`}
                    className="w-100 h-100"
                    style={{ border: 'none' }}
                    title={archivo.nombreOriginal}
                  />
                )}

                {/* Unsupported file types */}
                {!isPDF && !isImage && !isOfficeDoc && (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <FileText size={64} className="text-muted mb-3" />
                      <h5 className="text-muted">Vista previa no disponible</h5>
                      <p className="text-muted mb-4">
                        No se puede mostrar una vista previa de este tipo de archivo.
                      </p>
                      <div className="d-flex gap-2 justify-content-center">
                        <a
                          href={archivo.url}
                          download={archivo.nombreOriginal}
                          className="btn btn-primary"
                        >
                          <Download size={16} className="me-2" />
                          Descargar archivo
                        </a>
                        <a
                          href={archivo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary"
                        >
                          <ExternalLink size={16} className="me-2" />
                          Abrir externamente
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}