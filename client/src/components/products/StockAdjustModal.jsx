import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PackagePlus, PackageMinus } from 'lucide-react';
import { productService } from '../../services/productService';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import '../../css/StockAdjustModal.css';

export default function StockAdjustModal({ isOpen, onClose, product, onSaved }) {
  const [direction, setDirection] = useState('in'); // 'in' = add stock, 'out' = remove stock

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { quantity: '', note: '' } });

  useEffect(() => {
    if (isOpen) {
      setDirection('in');
      reset({ quantity: '', note: '' });
    }
  }, [isOpen, reset]);

  const onSubmit = async ({ quantity, note }) => {
    const signedQuantity = direction === 'in' ? Math.abs(Number(quantity)) : -Math.abs(Number(quantity));
    try {
      await productService.adjustStock(product.id, signedQuantity, note || undefined);
      toast.success('Stock adjusted.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not adjust stock.');
    }
  };

  if (!product) return null;

  return (
    <Modal
  isOpen={isOpen}
  onClose={onClose}
  title={`កែសម្រួលស្តុក — ${product.name}`}
  size="sm"
>
  <p className="stock-current">
    ស្តុកបច្ចុប្បន្ន៖{" "}
    <span className="stock-current-value">
      {product.stock_quantity} {product.unit}
    </span>
  </p>

  <div className="stock-direction-toggle">
    <button
      type="button"
      onClick={() => setDirection('in')}
      className={`stock-direction-btn${direction === 'in' ? ' active-in' : ''}`}
    >
      <PackagePlus size={16} /> បន្ថែមស្តុក
    </button>

    <button
      type="button"
      onClick={() => setDirection('out')}
      className={`stock-direction-btn${direction === 'out' ? ' active-out' : ''}`}
    >
      <PackageMinus size={16} /> ដកស្តុក
    </button>
  </div>

  <form onSubmit={handleSubmit(onSubmit)} className="stock-form">
    <Input
      label="បរិមាណ"
      type="number"
      min="1"
      step="1"
      placeholder="ឧ. 10"
      error={errors.quantity?.message}
      {...register('quantity', {
        required: 'សូមបញ្ចូលបរិមាណ។',
        min: {
          value: 1,
          message: 'បរិមាណត្រូវមានយ៉ាងតិច 1។',
        },
      })}
    />

    <Input
      label="មូលហេតុ / កំណត់សម្គាល់ (ជាជម្រើស)"
      placeholder="ឧ. ទំនិញខូច កែតម្រូវស្តុក..."
      {...register('note')}
    />

    <div className="stock-form-actions">
      <Button type="button" variant="outline" onClick={onClose}>
        បោះបង់
      </Button>

      <Button
        type="submit"
        loading={isSubmitting}
        variant={direction === 'out' ? 'danger' : 'primary'}
      >
        {direction === 'in' ? 'បន្ថែមស្តុក' : 'ដកស្តុក'}
      </Button>
    </div>
  </form>
</Modal>
  );
}