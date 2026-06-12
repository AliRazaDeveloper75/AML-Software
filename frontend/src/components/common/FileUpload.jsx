import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function FileUpload({ label, accept, maxSize = 10, onUpload, description }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validate = (f) => {
    if (!f) return 'No file selected'
    if (f.size > maxSize * 1024 * 1024) return `File size must be under ${maxSize}MB`
    return null
  }

  const handle = (f) => {
    const err = validate(f)
    if (err) { setError(err); return }
    setError(null)
    setFile(f)
    onUpload?.(f)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handle(f)
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <motion.div
        animate={{ borderColor: dragging ? '#3b82f6' : undefined }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200',
          dragging
            ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-950/20'
            : 'border-slate-200 dark:border-navy-600 hover:border-accent-400 hover:bg-slate-50 dark:hover:bg-navy-750',
          !file && 'cursor-pointer'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f) }}
        />
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-950/40 rounded-lg flex items-center justify-center">
                <File size={18} className="text-accent-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-10 h-10 bg-slate-100 dark:bg-navy-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload size={18} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Drop file here or <span className="text-accent-600">browse</span>
              </p>
              {description && (
                <p className="text-xs text-slate-400 mt-1">{description}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">Max {maxSize}MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <AlertCircle size={12} className="text-red-500" />
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}
    </div>
  )
}
