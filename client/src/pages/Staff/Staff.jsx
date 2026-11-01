import { useEffect, useState, useCallback } from 'react';
import { Plus, Users2, Pencil, ShieldCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import '../../css/Staff.css';

export default function Staff() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAll({ limit: 100 });
      setUsers(res.data);
    } catch {
      toast.error('Could not load staff.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (targetUser) => {
    if (targetUser.id === currentUser.id) {
      toast.error("You can't deactivate your own account.");
      return;
    }
    try {
      await userService.update(targetUser.id, { is_active: !targetUser.is_active });
      toast.success(targetUser.is_active ? 'Staff member deactivated.' : 'Staff member reactivated.');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status.');
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Name',
      render: (row) => (
        <div>
          <p className="staff-name">
            {row.full_name} {row.id === currentUser.id && <span className="staff-you-tag">(you)</span>}
          </p>
          <p className="staff-username">{row.username}</p>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (row) => <span className="staff-mono">{row.phone || '—'}</span> },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <Badge variant={row.role === 'admin' ? 'info' : 'neutral'}>{row.role}</Badge>,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => <Badge variant={row.is_active ? 'success' : 'danger'}>{row.is_active ? 'Active' : 'Deactivated'}</Badge>,
    },
    {
      key: 'last_login_at',
      label: 'Last login',
      render: (row) => (row.last_login_at ? new Date(row.last_login_at).toLocaleDateString() : 'Never'),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <div className="staff-row-actions">
          <button
            onClick={() => {
              setEditingUser(row);
              setIsFormOpen(true);
            }}
            className="staff-icon-btn"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handleToggleActive(row)}
            disabled={row.id === currentUser.id}
            className={`staff-toggle-btn ${row.is_active ? 'active' : 'inactive'}`}
            title={row.is_active ? 'Deactivate' : 'Reactivate'}
          >
            {row.is_active ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
          </button>
        </div>
      ),
    },
  ];

  return (
   <div>
  <PageHeader
    title="បុគ្គលិក"
    description="គ្រប់គ្រងអ្នកដែលអាចចូលប្រើប្រព័ន្ធ និងសិទ្ធិដែលពួកគេមាន។"
    action={
      <Button
        
        onClick={() => {
          setEditingUser(null);
          setIsFormOpen(true);
        }}
      >
        បន្ថែមបុគ្គលិកថ្មី
      </Button>
    }
  />

  <DataTable
    columns={columns}
    data={users}
    isLoading={isLoading}
    emptyIcon={Users2}
    emptyTitle="មិនទាន់មានគណនីបុគ្គលិក"
    emptyDescription="សូមបន្ថែមបុគ្គលិក ដើម្បីអនុញ្ញាតឲ្យពួកគេចូលប្រើប្រព័ន្ធ។"
  />

  <StaffFormModal
    isOpen={isFormOpen}
    onClose={() => setIsFormOpen(false)}
    targetUser={editingUser}
    currentUserId={currentUser.id}
    onSaved={() => {
      setIsFormOpen(false);
      fetchUsers();
    }}
  />
</div>
  );
}

function StaffFormModal({ isOpen, onClose, targetUser, currentUserId, onSaved }) {
  const isEditing = !!targetUser;
  const isSelf = isEditing && targetUser.id === currentUserId;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        full_name: targetUser?.full_name || '',
        email: targetUser?.email || '',
        username: targetUser?.username || '',
        phone: targetUser?.phone || '',
        role: targetUser?.role || 'cashier',
        password: '',
      });
    }
  }, [isOpen, targetUser, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        const { password, ...updatePayload } = values; // password isn't editable here
        await userService.update(targetUser.id, updatePayload);
        toast.success('Staff member updated.');
      } else {
        await userService.create(values);
        toast.success('Staff member created.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save staff member.');
    }
  };

  return (
    <Modal
  isOpen={isOpen}
  onClose={onClose}
  title={isEditing ? 'កែប្រែបុគ្គលិក' : 'បន្ថែមបុគ្គលិកថ្មី'}
>
  <form onSubmit={handleSubmit(onSubmit)} className="staff-form">
    <Input
      label="ឈ្មោះពេញ"
      placeholder="ឧ. Jane Cashier"
      error={errors.full_name?.message}
      {...register('full_name', {
        required: 'សូមបញ្ចូលឈ្មោះ។',
      })}
    />

    <div className="staff-grid-2">
      <Input
        label="ឈ្មោះអ្នកប្រើប្រាស់"
        placeholder="ឧ. janec"
        error={errors.username?.message}
        {...register('username', {
          required: 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់។',
        })}
      />

      <Input
        label="អ៊ីមែល"
        type="email"
        placeholder="jane@shop.com"
        error={errors.email?.message}
        {...register('email', {
          required: 'សូមបញ្ចូលអ៊ីមែល។',
        })}
      />
    </div>

    <div className="staff-grid-2">
      <Input
        label="លេខទូរស័ព្ទ (ជាជម្រើស)"
        placeholder="+254..."
        {...register('phone')}
      />

      <Select
        label="តួនាទី"
        disabled={isSelf}
        hint={isSelf ? 'អ្នកមិនអាចប្ដូរតួនាទីខ្លួនឯងបានទេ។' : undefined}
        {...register('role')}
      >
        <option value="cashier">អ្នកគិតលុយ</option>
        <option value="admin">អ្នកគ្រប់គ្រង</option>
      </Select>
    </div>

    {!isEditing && (
      <Input
        label="ពាក្យសម្ងាត់បណ្តោះអាសន្ន"
        type="password"
        placeholder="យ៉ាងហោចណាស់ 6 តួអក្សរ"
        hint="សូមផ្តល់ឲ្យបុគ្គលិក — គួរតែប្ដូរពេលចូលប្រើលើកដំបូង។"
        error={errors.password?.message}
        {...register('password', {
          required: 'សូមបញ្ចូលពាក្យសម្ងាត់។',
          minLength: {
            value: 6,
            message: 'យ៉ាងហោចណាស់ 6 តួអក្សរ។',
          },
        })}
      />
    )}

    <div className="staff-form-actions">
      <Button type="button" variant="outline" onClick={onClose}>
        បោះបង់
      </Button>

      <Button type="submit" loading={isSubmitting}>
        {isEditing ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតបុគ្គលិក'}
      </Button>
    </div>
  </form>
</Modal>
  );
}