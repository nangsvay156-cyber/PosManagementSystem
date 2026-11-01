import { CheckCircle2, Printer, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import '../../css/SaleSuccessModal.css';

export default function SaleSuccessModal({ sale, onClose, onNewSale }) {
  const navigate = useNavigate();

  if (!sale) return null;

  return (
    <Modal
  isOpen={!!sale}
  onClose={onClose}
  title="ការលក់បានបញ្ចប់ដោយជោគជ័យ"
  size="sm"
>
  <div className="ssm-wrap">
    <div className="ssm-icon">
      <CheckCircle2 size={28} />
    </div>

    <p className="ssm-invoice">
      វិក្កយបត្រ៖ {sale.invoice_number}
    </p>

    <p className="ssm-total">
      សរុប៖ ${Number(sale.total_amount).toFixed(2)}
    </p>

    {Number(sale.change_due) > 0 && (
      <p className="ssm-change">
        ប្រាក់អាប់៖ ${Number(sale.change_due).toFixed(2)}
      </p>
    )}

    <div className="ssm-actions">
      <Button
        variant="outline"
        className="ssm-action-btn"
        icon={Printer}
        onClick={() => navigate(`/sales/${sale.id}/invoice`)}
      >
        បោះពុម្ពវិក្កយបត្រ
      </Button>

      <Button
        className="ssm-action-btn"
        icon={Plus}
        onClick={onNewSale}
      >
        ការលក់ថ្មី
      </Button>
    </div>
  </div>
</Modal>
  );
}