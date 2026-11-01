import { useEffect, useState, useCallback } from 'react';
import { Plus, Tags, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { categoryService } from '../../services/categoryService';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import useDebounce from '../../hooks/useDebounce';
import '../../css/Categories.css';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await categoryService.getAll({ search: debouncedSearch || undefined, limit: 100 });
      setCategories(res.data);
    } catch {
      toast.error('Could not load categories.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateForm = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await categoryService.remove(deletingCategory.id);
      toast.success('Category deleted.');
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (row) => <span className="categories-name">{row.name}</span> },
    { key: 'description', label: 'Description', render: (row) => row.description || '—' },
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
        <div className="categories-row-actions">
          <button onClick={() => openEditForm(row)} className="categories-icon-btn">
            <Pencil size={15} />
          </button>
          <button onClick={() => setDeletingCategory(row)} className="categories-icon-btn danger">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
  <PageHeader
    title="ប្រភេទផលិតផល"
    description="រៀបចំផលិតផលជាក្រុម ដើម្បីងាយស្រួលស្វែងរក និងរាយការណ៍។"
    action={
      <Button  onClick={openCreateForm}>
        បន្ថែមប្រភេទថ្មី
      </Button>
    }
  />

  <div className="categories-search-wrap">
    <Input
      placeholder="ស្វែងរកប្រភេទផលិតផល..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  <DataTable
    columns={columns}
    data={categories}
    isLoading={isLoading}
    emptyIcon={Tags}
    emptyTitle="មិនទាន់មានប្រភេទផលិតផល"
    emptyDescription="សូមបង្កើតប្រភេទដំបូង ដើម្បីចាប់ផ្តើមរៀបចំផលិតផល។"
  />

  <CategoryFormModal
    isOpen={isFormOpen}
    onClose={() => setIsFormOpen(false)}
    category={editingCategory}
    onSaved={() => {
      setIsFormOpen(false);
      fetchCategories();
    }}
  />

  <ConfirmDialog
    isOpen={!!deletingCategory}
    onClose={() => setDeletingCategory(null)}
    onConfirm={handleDelete}
    isLoading={isDeleting}
    title="លុបប្រភេទផលិតផល"
    message={`តើអ្នកពិតជាចង់លុប "${deletingCategory?.name}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។ ផលិតផលដែលប្រើប្រភេទនេះត្រូវផ្លាស់ប្តូរជាមុន។`}
  />
</div>
  );
}

function CategoryFormModal({ isOpen, onClose, category, onSaved }) {
  const isEditing = !!category;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        name: category?.name || '',
        description: category?.description || '',
        is_active: category?.is_active ?? true,
      });
    }
  }, [isOpen, category, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await categoryService.update(category.id, values);
        toast.success('Category updated.');
      } else {
        await categoryService.create(values);
        toast.success('Category created.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save category.');
    }
  };

  return (
    <Modal
  isOpen={isOpen}
  onClose={onClose}
  title={isEditing ? 'កែប្រែប្រភេទ' : 'បន្ថែមប្រភេទថ្មី'}
  size="sm"
>
  <form onSubmit={handleSubmit(onSubmit)} className="categories-form">
    <Input
      label="ឈ្មោះប្រភេទ"
      placeholder="ឧ. ភេសជ្ជៈ"
      error={errors.name?.message}
      {...register('name', {
        required: 'សូមបញ្ចូលឈ្មោះប្រភេទ។',
      })}
    />

    <Input
      label="ការពិពណ៌នា (ជាជម្រើស)"
      placeholder="ឧ. ភេសជ្ជៈ និងទឹកផ្លែឈើ"
      {...register('description')}
    />

    <div className="categories-form-actions">
      <Button type="button" variant="outline" onClick={onClose}>
        បោះបង់
      </Button>

      <Button type="submit" loading={isSubmitting}>
        {isEditing ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតប្រភេទ'}
      </Button>
    </div>
  </form>
</Modal>
  );
}