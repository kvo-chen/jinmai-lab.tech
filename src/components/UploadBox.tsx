import { useRef, useState, useCallback } from 'react'
import { useTheme } from '@/hooks/useTheme'

type Variant = 'image' | 'audio' | 'file'

interface UploadBoxProps {
  accept: string
  onFile: (file: File) => void
  title?: string
  description?: string
  previewUrl?: string
  variant?: Variant
  className?: string
}

export default function UploadBox({ accept, onFile, title, description, previewUrl, variant = 'file', className }: UploadBoxProps) {
  const { isDark } = useTheme()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [localPreview, setLocalPreview] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file?: File | null) => {
    if (!file) return
    try {
      if (variant === 'image' || variant === 'audio') {
        const url = URL.createObjectURL(file)
        setLocalPreview(url)
      }
    } catch {}
    onFile(file)
  }, [onFile, variant])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    handleFile(f)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    handleFile(f)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const showPreview = previewUrl || localPreview
  const icon = variant === 'image' ? 'far fa-image' : variant === 'audio' ? 'fas fa-music' : 'fas fa-file-import'
  const accent = isDark ? 'ring-red-500/40 hover:ring-red-500/60' : 'ring-red-600/40 hover:ring-red-600/60'

  return (
    <div className={className}>
      {title && <div className="mb-2 text-sm font-medium">{title}</div>}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative rounded-2xl border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'} p-4 transition-all ${dragOver ? accent : 'ring-0'} cursor-pointer`}
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label="上传文件"
      >
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} mr-4`}>
            <i className={icon}></i>
          </div>
          <div className="flex-1">
            <div className="text-sm">{description || '拖拽文件到此，或点击选择'}</div>
            <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{accept}</div>
          </div>
          <button
            type="button"
            className="ml-4 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
          >
            选择文件
          </button>
        </div>

        {variant === 'image' && showPreview && (
          <div className="mt-4">
            <img src={showPreview} alt="预览" className="w-full h-40 object-cover rounded-lg" loading="lazy" decoding="async" />
          </div>
        )}
        {variant === 'audio' && showPreview && (
          <div className="mt-4">
            <audio controls src={showPreview} className="w-full" />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} />
    </div>
  )
}

