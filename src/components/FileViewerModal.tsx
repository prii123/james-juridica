'use client'

import { useState, useEffect } from 'react'
import { X, Download, ExternalLink, FileText, Image } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'

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
      className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/80 p-4"
      onClick={handleBackdropClick}
    >
      <div className="flex w-full max-w-5xl flex-col rounded-xl bg-white shadow-xl" style={{ height: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <div className="flex flex-1 items-center gap-3">
            <div>
              {isImage && <Image size={24} className="text-sky-700" />}
              {isPDF && <FileText size={24} className="text-red-600" />}
              {isOfficeDoc && <FileText size={24} className="text-blue-800" />}
              {!isImage && !isPDF && !isOfficeDoc && <FileText size={24} className="text-slate-500" />}
            </div>
            <div>
              <h5 className="m-0 font-semibold text-slate-800">{archivo.nombreOriginal}</h5>
              <small className="text-slate-500">
                {archivo.tipoMime} • {formatFileSize(archivo.tamano)}
              </small>
            </div>
          </div>

          <div className="flex gap-2">
            <a href={archivo.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outlinePrimary" size="icon" title="Abrir en nueva pestaña">
                <ExternalLink size={16} />
              </Button>
            </a>
            <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar">
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Spinner />
                <p className="text-slate-500">Cargando archivo...</p>
              </div>
            </div>
          ) : (
            <>
              {/* PDF Viewer */}
              {isPDF && (
                <iframe
                  src={`${archivo.url}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
                  className="h-full w-full border-0"
                  title={archivo.nombreOriginal}
                />
              )}

              {/* Image Viewer */}
              {isImage && (
                <div className="flex h-full items-center justify-center bg-slate-50 p-3">
                  <img
                    src={archivo.url}
                    alt={archivo.nombreOriginal}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-md"
                  />
                </div>
              )}

              {/* Office Documents */}
              {isOfficeDoc && (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(archivo.url)}`}
                  className="h-full w-full border-0"
                  title={archivo.nombreOriginal}
                />
              )}

              {/* Unsupported file types */}
              {!isPDF && !isImage && !isOfficeDoc && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <FileText size={64} className="mx-auto mb-3 text-slate-300" />
                    <h5 className="font-semibold text-slate-600">Vista previa no disponible</h5>
                    <p className="mb-4 text-slate-500">
                      No se puede mostrar una vista previa de este tipo de archivo.
                    </p>
                    <div className="flex justify-center gap-2">
                      <a href={archivo.url} download={archivo.nombreOriginal}>
                        <Button>
                          <Download size={16} />
                          Descargar archivo
                        </Button>
                      </a>
                      <a href={archivo.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outlinePrimary">
                          <ExternalLink size={16} />
                          Abrir externamente
                        </Button>
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
  )
}
