import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import '../../css/ConfirmDialog.css';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'តើអ្នកប្រាកដទេ?',
  message,
  confirmLabel = 'លុប',
  isLoading = false,
  danger = true,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="confirm-body">
        <div className={`confirm-icon ${danger ? 'danger' : 'warning'}`}>
          <AlertTriangle size={18} />
        </div>

        <p className="confirm-message">{message}</p>
      </div>

      <div className="confirm-actions">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          បោះបង់
        </Button>

        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}