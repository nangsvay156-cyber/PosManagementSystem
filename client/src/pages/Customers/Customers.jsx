import { useEffect, useState, useCallback } from 'react';
import { Plus, Users, Pencil, Trash2, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { customerService } from '../../services/customerService';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { PageSpinner, EmptyState } from '../../components/ui/Feedback';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import '../../css/Customers.css';

export default function Customers() {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerService.getAll({ search: debouncedSearch || undefined, limit: 100 });
      setCustomers(res.data);
    } catch {
      toast.error('Could not load customers.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await customerService.remove(deletingCustomer.id);
      toast.success('Customer deleted.');
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete customer.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (row) => <span className="customers-name">{row.name}</span> },
    { key: 'phone', label: 'Phone', render: (row) => <span className="customers-mono">{row.phone || '—'}</span> },
    { key: 'email', label: 'Email', render: (row) => row.email || '—' },
    {
      key: 'loyalty_points',
      label: 'Loyalty pts',
      className: 'text-right num',
      render: (row) => row.loyalty_points,
    },
    {
      key: 'credit_balance',
      label: 'Credit owed',
      className: 'text-right num',
      render: (row) =>
        Number(row.credit_balance) > 0 ? (
          <span className="customers-credit-owed">${Number(row.credit_balance).toFixed(2)}</span>
        ) : (
          <span className="customers-credit-zero">$0.00</span>
        ),
    },
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
        <div className="customers-row-actions">
          <button onClick={() => setHistoryCustomer(row)} className="customers-icon-btn" title="Purchase history">
            <History size={15} />
          </button>
          <button
            onClick={() => {
              setEditingCustomer(row);
              setIsFormOpen(true);
            }}
            className="customers-icon-btn"
          >
            <Pencil size={15} />
          </button>
          {isAdmin && (
            <button onClick={() => setDeletingCustomer(row)} className="customers-icon-btn danger">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
   <div>
  <PageHeader
    title="អតិថិជន"
    description="អ្នកដែលទិញពីហាងរបស់អ្នក។ តាមដានព័ត៌មានទំនាក់ទំនង ការទិញ និងបំណុល។"
    action={
      <Button
        
        onClick={() => {
          setEditingCustomer(null);
          setIsFormOpen(true);
        }}
      >
        បន្ថែមអតិថិជនថ្មី
      </Button>
    }
  />

  <div className="customers-search-wrap">
    <Input
      placeholder="ស្វែងរកអតិថិជន..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  <DataTable
    columns={columns}
    data={customers}
    isLoading={isLoading}
    emptyIcon={Users}
    emptyTitle="មិនទាន់មានអតិថិជន"
    emptyDescription="សូមបន្ថែមអតិថិជន ដើម្បីតាមដានការទិញ និងបំណុល។"
  />

  <CustomerFormModal
    isOpen={isFormOpen}
    onClose={() => setIsFormOpen(false)}
    customer={editingCustomer}
    onSaved={() => {
      setIsFormOpen(false);
      fetchCustomers();
    }}
  />

  <CustomerHistoryModal
    customer={historyCustomer}
    onClose={() => setHistoryCustomer(null)}
  />

  <ConfirmDialog
    isOpen={!!deletingCustomer}
    onClose={() => setDeletingCustomer(null)}
    onConfirm={handleDelete}
    isLoading={isDeleting}
    title="លុបអតិថិជន"
    message={`តើអ្នកពិតជាចង់លុប "${deletingCustomer?.name}" មែនទេ? អតិថិជនដែលមានប្រវត្តិលក់មិនអាចលុបបានទេ — សូមបិទដំណើរការជំនួសវិញ។`}
  />
</div>
  );
}

function CustomerFormModal({ isOpen, onClose, customer, onSaved }) {
  const isEditing = !!customer;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
      });
    }
  }, [isOpen, customer, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await customerService.update(customer.id, values);
        toast.success('Customer updated.');
      } else {
        await customerService.create(values);
        toast.success('Customer created.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save customer.');
    }
  };

  return (
    <Modal
  isOpen={isOpen}
  onClose={onClose}
  title={isEditing ? 'កែប្រែអតិថិជន' : 'បន្ថែមអតិថិជនថ្មី'}
  size="sm"
>
  <form onSubmit={handleSubmit(onSubmit)} className="customers-form">
    <Input
      label="ឈ្មោះ"
      placeholder="ឧ. Jane Doe"
      error={errors.name?.message}
      {...register('name', {
        required: 'សូមបញ្ចូលឈ្មោះ។',
      })}
    />

    <Input
      label="លេខទូរស័ព្ទ"
      placeholder="+254..."
      {...register('phone')}
    />

    <Input
      label="អ៊ីមែល"
      type="email"
      placeholder="jane@example.com"
      {...register('email')}
    />

    <Input
      label="អាសយដ្ឋាន"
      placeholder="ផ្លូវ, ទីក្រុង"
      {...register('address')}
    />

    <div className="customers-form-actions">
      <Button type="button" variant="outline" onClick={onClose}>
        បោះបង់
      </Button>

      <Button type="submit" loading={isSubmitting}>
        {isEditing ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតអតិថិជន'}
      </Button>
    </div>
  </form>
</Modal>
  );
}

function CustomerHistoryModal({ customer, onClose }) {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setIsLoading(true);
    customerService
      .getSales(customer.id)
      .then((res) => setSales(res.data))
      .catch(() => toast.error('Could not load purchase history.'))
      .finally(() => setIsLoading(false));
  }, [customer]);

  return (
    <Modal
  isOpen={!!customer}
  onClose={onClose}
  title={`ប្រវត្តិការទិញ — ${customer?.name || ''}`}
  size="lg"
>
  {isLoading ? (
    <PageSpinner />
  ) : sales.length === 0 ? (
    <EmptyState
      title="មិនទាន់មានការទិញ"
      description="អតិថិជននេះមិនទាន់បានធ្វើការលក់ណាមួយទេ។"
    />
  ) : (
    <div className="customers-history-list">
      {sales.map((sale) => (
        <div key={sale.id} className="customers-history-row">
          <div>
            <p className="customers-history-invoice">
              វិក្កយបត្រ៖ {sale.invoice_number}
            </p>

            <p className="customers-history-date">
              {new Date(sale.created_at).toLocaleString()}
            </p>
          </div>

          <div className="customers-history-right">
            <p className="customers-history-amount">
              ${Number(sale.total_amount).toFixed(2)}
            </p>

            <Badge
              variant={
                sale.status === 'completed'
                  ? 'success'
                  : sale.status === 'refunded'
                  ? 'danger'
                  : 'neutral'
              }
            >
              {sale.status === 'completed'
                ? 'បានបញ្ចប់'
                : sale.status === 'refunded'
                ? 'បានបង្វិល'
                : 'កំពុងដំណើរការ'}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )}
</Modal>
  );
}