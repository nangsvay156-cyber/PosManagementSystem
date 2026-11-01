import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import '../../css/CreatePurchaseOrderModal.css';

const emptyLine = () => ({ product_id: '', received_quantity:1, unit_cost: '' });

export default function CreatePurchaseOrderModal({ isOpen, onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([supplierService.getAll({ limit: 100 }), productService.getAll({ limit: 200 })])
        .then(([sRes, pRes]) => {
          setSuppliers(sRes.data);
          setProducts(pRes.data);
        })
        .catch(() => toast.error('Could not load suppliers/products.'));
      setSupplierId('');
      setNotes('');
      setLines([emptyLine()]);
    }
  }, [isOpen]);

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const total = lines.reduce((sum, l) => sum + (Number(l.received_quantity ) || 0) * (Number(l.unit_cost) || 0), 0);

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!supplierId) {
    toast.error('Select a supplier.');
    return;
  }
  const validLines = lines.filter((l) => l.product_id && l.received_quantity  > 0 && l.unit_cost !== '');
  if (validLines.length === 0) {
    toast.error('Add at least one valid line item.');
    return;
  }

  setIsSubmitting(true);
  try {
    await purchaseOrderService.create({
      supplier_id: Number(supplierId),
      notes: notes || undefined,
      items: validLines.map((l) => ({
        product_id: Number(l.product_id),
        quantity_ordered: Number(l.received_quantity), // ✅ renamed from "quantity"
        unit_cost: Number(l.unit_cost),
      })),
    });
    toast.success('Purchase order created.');
    onSaved();
  } catch (err) {
    const message = err.response?.data?.message || 'Could not create purchase order.';
    toast.error(message);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="បង្កើតការបញ្ជាទិញថ្មី" size="xl">
  <form onSubmit={handleSubmit} className="cpo-form">
    <div className="cpo-grid-2">
      <Select
        label="អ្នកផ្គត់ផ្គង់"
        value={supplierId}
        onChange={(e) => setSupplierId(e.target.value)}
        required
      >
        <option value="">ជ្រើសរើសអ្នកផ្គត់ផ្គង់</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      <Input
        label="កំណត់សម្គាល់ (ជាជម្រើស)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="ឧ. បំពេញស្តុកបន្ទាន់"
      />
    </div>

    <div>
      <div className="cpo-lines-header-row">
        <label className="cpo-lines-label">បញ្ជីទំនិញ</label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={Plus}
          onClick={addLine}
        >
          បន្ថែមជួរ
        </Button>
      </div>

      <div className="cpo-lines-box">
        <div className="cpo-lines-col-header">
          <span>ផលិតផល</span>
          <span>បរិមាណ</span>
          <span>តម្លៃដើម</span>
          <span className="align-right">សរុប</span>
          <span></span>
        </div>

        {lines.map((line, index) => {
          const subtotal =
            (Number(line.received_quantity ) || 0) * (Number(line.unit_cost) || 0);

          return (
            <div key={index} className="cpo-line-row">
              <Select
                value={line.product_id}
                onChange={(e) =>
                  updateLine(index, "product_id", e.target.value)
                }
                required
              >
                <option value="">ជ្រើសរើសផលិតផល</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </Select>

              <Input
                type="number"
                min="1"
                value={line.received_quantity }
                onChange={(e) =>
                  updateLine(index, "received_quantity", e.target.value)
                }
              />

              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={line.unit_cost}
                onChange={(e) =>
                  updateLine(index, "unit_cost", e.target.value)
                }
              />

              <span className="cpo-line-subtotal">
                ${subtotal.toFixed(2)}
              </span>

              <button
                type="button"
                onClick={() => removeLine(index)}
                disabled={lines.length === 1}
                className="cpo-line-remove-btn"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>

    <div className="cpo-total-row">
      <span className="cpo-total-label">តម្លៃសរុបនៃការបញ្ជាទិញ</span>
      <span className="cpo-total-value">${total.toFixed(2)}</span>
    </div>

    <div className="cpo-form-actions">
      <Button type="button" variant="outline" onClick={onClose}>
        បោះបង់
      </Button>

      <Button type="submit" loading={isSubmitting}>
        បង្កើតការបញ្ជាទិញ
      </Button>
    </div>
  </form>
</Modal>
  );
}