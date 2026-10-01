import Modal from "./Modal";
import { AlertTriangle, ShieldAlert } from "lucide-react";

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="420px">
      <div className="confirm-modal-content">
        <div className={`confirm-icon-box confirm-${variant}`}>
          {variant === "danger" ? <ShieldAlert size={24} /> : <AlertTriangle size={24} />}
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
