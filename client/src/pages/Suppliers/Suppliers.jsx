import { useEffect, useState, useCallback } from 'react';
import { Plus, Truck, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { supplierService } from '../../services/supplierService';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import useDebounce from '../../hooks/useDebounce';
import '../../css/Suppliers.css';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await supplierService.getAll({ search: debouncedSearch || undefined, limit: 100 });
      setSuppliers(res.data);
    } catch {
      toast.error('Could not load suppliers.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await supplierService.remove(deletingSupplier.id);
      toast.success('Supplier deleted.');
      setDeletingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete supplier.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (row) => <span className="suppliers-name">{row.name}</span> },
    { key: 'company_name', label: 'Company', render: (row) => row.company_name || '—' },
    { key: 'phone', label: 'Phone', render: (row) => <span className="suppliers-mono">{row.phone || '—'}</span> },
    { key: 'email', label: 'Email', render: (row) => row.email || '—' },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => <Badge variant={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <div className="suppliers-row-actions">
          <button
            onClick={() => {
              setEditingSupplier(row);
              setIsFormOpen(true);
            }}
            className="suppliers-icon-btn"
          >
            <Pencil size={15} />
          </button>
          <button onClick={() => setDeletingSupplier(row)} className="suppliers-icon-btn danger">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
  <PageHeader
    title="អ្នកផ្គត់ផ្គង់"
    description="អ្នកលក់ដែលអ្នកទិញទំនិញ/ស្តុកពីពួកគេ។"
    action={
      <Button
       
        onClick={() => {
          setEditingSupplier(null);
          setIsFormOpen(true);
        }}
      >
        បន្ថែមអ្នកផ្គត់ផ្គង់ថ្មី
      </Button>
    }
  />

  <div className="suppliers-search-wrap">
    <Input
      placeholder="ស្វែងរកអ្នកផ្គត់ផ្គង់..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  <DataTable
    columns={columns}
    data={suppliers}
    isLoading={isLoading}
    emptyIcon={Truck}
    emptyTitle="មិនទាន់មានអ្នកផ្គត់ផ្គង់"
    emptyDescription="សូមបន្ថែមអ្នកផ្គត់ផ្គង់ ដើម្បីចាប់ផ្តើមបង្កើតបញ្ជាទិញ។"
  />

  <SupplierFormModal
    isOpen={isFormOpen}
    onClose={() => setIsFormOpen(false)}
    supplier={editingSupplier}
    onSaved={() => {
      setIsFormOpen(false);
      fetchSuppliers();
    }}
  />

  <ConfirmDialog
    isOpen={!!deletingSupplier}
    onClose={() => setDeletingSupplier(null)}
    onConfirm={handleDelete}
    isLoading={isDeleting}
    title="លុបអ្នកផ្គត់ផ្គង់"
    message={`តើអ្នកពិតជាចង់លុប "${deletingSupplier?.name}" មែនទេ? អ្នកផ្គត់ផ្គង់ដែលភ្ជាប់នឹងផលិតផល ឬបញ្ជាទិញមិនអាចលុបបានទេ។`}
  />
</div>
  );
}

function SupplierFormModal({ isOpen, onClose, supplier, onSaved }) {
  const isEditing = !!supplier;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        name: supplier?.name || '',
        company_name: supplier?.company_name || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        tax_number: supplier?.tax_number || '',
      });
    }
  }, [isOpen, supplier, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await supplierService.update(supplier.id, values);
        toast.success('Supplier updated.');
      } else {
        await supplierService.create(values);
        toast.success('Supplier created.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save supplier.');
    }
  };

  return (
    <Modal
  isOpen={isOpen}
  onClose={onClose}
  title={isEditing ? 'កែប្រែអ្នកផ្គត់ផ្គង់' : 'បន្ថែមអ្នកផ្គត់ផ្គង់ថ្មី'}
>
  <form onSubmit={handleSubmit(onSubmit)} className="suppliers-form">
    <Input
      label="ឈ្មោះអ្នកទំនាក់ទំនង"
      placeholder="ឧ. John Mwangi"
      error={errors.name?.message}
      {...register('name', {
        required: 'សូមបញ្ចូលឈ្មោះ។',
      })}
    />

    <Input
      label="ឈ្មោះក្រុមហ៊ុន"
      placeholder="ឧ. Coca-Cola Distributors Ltd"
      {...register('company_name')}
    />

    <div className="suppliers-grid-2">
      <Input
        label="លេខទូរស័ព្ទ"
        placeholder="+254..."
        {...register('phone')}
      />

      <Input
        label="អ៊ីមែល"
        type="email"
        placeholder="contact@company.com"
        {...register('email')}
      />
    </div>

    <Input
      label="អាសយដ្ឋាន"
      placeholder="ផ្លូវ, ទីក្រុង"
      {...register('address')}
    />

    <Input
      label="លេខពន្ធ"
      placeholder="ជាជម្រើស"
      {...register('tax_number')}
    />

    <div className="suppliers-form-actions">
      <Button type="button" variant="outline" onClick={onClose}>
        បោះបង់
      </Button>

      <Button type="submit" loading={isSubmitting}>
        {isEditing ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតអ្នកផ្គត់ផ្គង់'}
      </Button>
    </div>
  </form>
</Modal>
  );
}