import { useEffect } from 'react';

function Modal({ isOpen, title, children, onClose, onConfirm, confirmDisabled }) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      if (e.key === 'Enter') {
        const tag = document.activeElement?.tagName;

        // Evita submit acidental em campos multiline
        if (tag === 'TEXTAREA') return;

        if (!confirmDisabled && onConfirm) {
          e.preventDefault();
          onConfirm();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm, confirmDisabled]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span>{title}</span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;