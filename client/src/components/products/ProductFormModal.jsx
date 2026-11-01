import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { productService } from '../../services/productService';
import { supplierService } from '../../services/supplierService';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import '../../css/ProductFormModal.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function ProductFormModal({ isOpen, onClose, product, categories, onSaved }) {
  const isEditing = !!product;
  const [suppliers, setSuppliers] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (isOpen) {
      supplierService.getAll({ limit: 100 }).then((res) => setSuppliers(res.data)).catch(() => {});
      setImageFile(null);
      setImagePreview(product?.image ? `${API_ORIGIN}${product.image}` : null);
      reset({
        name: product?.name || '',
        sku: product?.sku || '',
        barcode: product?.barcode || '',
        description: product?.description || '',
        unit: product?.unit || 'pcs',
        category_id: product?.category_id || '',
        supplier_id: product?.supplier_id || '',
        cost_price: product?.cost_price ?? 0,
        selling_price: product?.selling_price ?? '',
        tax_percent: product?.tax_percent ?? 0,
        discount: product?.discount ?? 0,
        stock_quantity: isEditing ? undefined : 0,
        low_stock_alert: product?.low_stock_alert ?? 5,
      });
    }
  }, [isOpen, product, isEditing, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    if (imageFile) formData.append('image', imageFile);

    try {
      if (isEditing) {
        await productService.update(product.id, formData);
        toast.success('Product updated.');
      } else {
        await productService.create(formData);
        toast.success('Product created.');
      }
      onSaved();
    } catch (err) {
      const message = err.response?.data?.message || 'Could not save product.';
      const details = err.response?.data?.errors;
      toast.error(Array.isArray(details) ? `${message}: ${details[0]?.message}` : message);
    }
  };

  return (
    <Modal
  isOpen={isOpen}
  onClose={onClose}
  title={isEditing ? 'កែប្រែផលិតផល' : 'បន្ថែមផលិតផលថ្មី'}
  size="lg"
>
  <form onSubmit={handleSubmit(onSubmit)} className="pfm-form">
    <div className="pfm-top-row">
      <label className="pfm-image-upload">
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="pfm-image-preview" />
        ) : (
          <div className="pfm-image-placeholder">
            <Upload size={18} />
            <span>បញ្ចូលរូបភាព</span>
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="pfm-image-input"
          onChange={handleImageChange}
        />
      </label>

      <div className="pfm-fields-col">
        <Input
          label="ឈ្មោះផលិតផល"
          placeholder="ឧ. កូកាកូឡា 500ml"
          error={errors.name?.message}
          {...register('name', {
            required: 'សូមបញ្ចូលឈ្មោះផលិតផល។',
          })}
        />

        <div className="pfm-grid-2">
          <Input
            label="លេខកូដផលិតផល (SKU)"
            placeholder="ឧ. COKE-500"
            error={errors.sku?.message}
            {...register('sku', {
              required: 'សូមបញ្ចូលលេខកូដផលិតផល។',
            })}
          />

          <Input
            label="បាកូដ (ជាជម្រើស)"
            placeholder="ស្កេន ឬបញ្ចូលបាកូដ"
            {...register('barcode')}
          />
        </div>
      </div>
    </div>

    <div className="pfm-grid-3">
      <Select label="ប្រភេទផលិតផល" {...register('category_id')}>
        <option value="">គ្មាន</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select label="អ្នកផ្គត់ផ្គង់" {...register('supplier_id')}>
        <option value="">គ្មាន</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      <Select label="ឯកតា" {...register('unit')}>
        <option value="pcs">ដុំ</option>
        <option value="kg">គីឡូក្រាម</option>
        <option value="g">ក្រាម</option>
        <option value="l">លីត្រ</option>
        <option value="ml">មីលីលីត្រ</option>
        <option value="box">ប្រអប់</option>
        <option value="pack">កញ្ចប់</option>
      </Select>
    </div>

    <div className="pfm-grid-4">
      <Input
        label="តម្លៃដើម"
        type="number"
        step="0.01"
        min="0"
        {...register('cost_price', { min: 0 })}
      />

      <Input
        label="តម្លៃលក់"
        type="number"
        step="0.01"
        min="0"
        error={errors.selling_price?.message}
        {...register('selling_price', {
          required: 'សូមបញ្ចូលតម្លៃលក់។',
          min: 0,
        })}
      />

      <Input
        label="ពន្ធ (%)"
        type="number"
        step="0.01"
        min="0"
        max="100"
        {...register('tax_percent')}
      />

      <Input
        label="បញ្ចុះតម្លៃ"
        type="number"
        step="0.01"
        min="0"
        {...register('discount')}
      />
    </div>

    <div className="pfm-grid-2">
      {!isEditing && (
        <Input
          label="ស្តុកដំបូង"
          type="number"
          min="0"
          {...register('stock_quantity')}
        />
      )}

      <Input
        label="កម្រិតជូនដំណឹងស្តុក"
        type="number"
        min="0"
        hint="ជូនដំណឹងនៅពេលស្តុកស្មើ ឬតិចជាងចំនួននេះ"
        {...register('low_stock_alert')}
      />
    </div>

    <Input
      label="ការពិពណ៌នា (ជាជម្រើស)"
      placeholder="ព័ត៌មានបន្ថែមអំពីផលិតផល"
      {...register('description')}
    />

    <div className="pfm-actions">
      <Button type="button" variant="outline" onClick={onClose}>
        បោះបង់
      </Button>

      <Button type="submit" loading={isSubmitting}>
        {isEditing ? 'រក្សាទុកការកែប្រែ' : 'បន្ថែមផលិតផល'}
      </Button>
    </div>
  </form>
</Modal>
  );
}