import { useEffect, useId, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Icon } from './Icons'

export function Dialog({
  title,
  children,
  onClose,
  className = '',
  initialFocusRef,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
  initialFocusRef?: RefObject<HTMLElement | null>
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const dialog = ref.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog?.showModal()
    initialFocusRef?.current?.focus()
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
    }
  }, [initialFocusRef])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`dialog ${className}`}
      onCancel={(event) => {
        event.preventDefault()
        closeRef.current()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-content">
        <button
          type="button"
          className="icon-button dialog-close"
          onClick={onClose}
          aria-label="Tutup"
        >
          <Icon name="close" />
        </button>
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  danger = false,
}: {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  danger?: boolean
}) {
  return (
    <Dialog title={title} onClose={onClose}>
      <p className="dialog-description">{description}</p>
      <div className="dialog-actions">
        <button className="button button-secondary" onClick={onClose}>
          Batal
        </button>
        <button
          className={`button ${danger ? 'button-danger' : 'button-primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
