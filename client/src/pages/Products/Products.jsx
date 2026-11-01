import { useEffect, useState, useCallback } from 'react';
import { Plus, Package, Pencil, Trash2, ImageOff, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import ProductFormModal from '../../components/products/ProductFormModal';
import StockAdjustModal from '../../components/products/StockAdjustModal';
import '../../css/Products.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const debouncedSearch = useDebounce(search);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productService.getAll({
        search: debouncedSearch || undefined,
        category_id: categoryFilter || undefined,
        low_stock: lowStockOnly ? 'true' : undefined,
        limit: 100,
      });
      setProducts(res.data);
    } catch {
      toast.error('Could not load products.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, categoryFilter, lowStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    categoryService.getAll({ limit: 100 }).then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await productService.remove(deletingProduct.id);
      toast.success('Product deleted.');
      setDeletingProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'image',
      label: '',
      className: 'w-14',
      render: (row) =>
        row.image ? (
          <img src={`${API_ORIGIN}${row.image}`} alt={row.name} className="products-thumb" />
        ) : (
          <div className="products-thumb-placeholder">
            <ImageOff size={16} />
          </div>
        ),
    },
    {
      key: 'name',
      label: 'Product',
      render: (row) => (
        <div>
          <p className="products-name">{row.name}</p>
          <p className="products-sku">{row.sku}</p>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (row) => row.Category?.name || '—' },
    {
      key: 'selling_price',
      label: 'Price',
      className: 'text-right num',
      render: (row) => `$${Number(row.selling_price).toFixed(2)}`,
    },
    {
      key: 'stock_quantity',
      label: 'Stock',
      className: 'text-right',
      render: (row) => (
        <span className={`products-stock ${row.stock_quantity <= row.low_stock_alert ? 'low' : 'normal'}`}>
          {row.stock_quantity} {row.unit}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        if (!row.is_active) return <Badge variant="neutral">Inactive</Badge>;
        if (row.stock_quantity <= row.low_stock_alert) return <Badge variant="danger">Low stock</Badge>;
        return <Badge variant="success">In stock</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <div className="products-row-actions">
          <button
            onClick={() => setAdjustingProduct(row)}
            className="products-icon-btn"
            title="Adjust stock"
          >
            <SlidersHorizontal size={15} />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setEditingProduct(row);
                  setIsFormOpen(true);
                }}
                className="products-icon-btn"
              >
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeletingProduct(row)} className="products-icon-btn danger">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
  <PageHeader
    title="ផលិតផល"
    description="បញ្ជីផលិតផល និងស្ថានភាពស្តុកទាំងអស់។"
    action={
      isAdmin && (
        <Button
          
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
        >
          បន្ថែមផលិតផល
        </Button>
      )
    }
  />

  <div className="products-toolbar">
    <Input
      placeholder="ស្វែងរកតាមឈ្មោះ លេខកូដ (SKU) ឬបាកូដ..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      containerClassName="w-64"
    />

    <Select
      value={categoryFilter}
      onChange={(e) => setCategoryFilter(e.target.value)}
      containerClassName="w-48"
    >
      <option value="">ប្រភេទទាំងអស់</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>

    <label className="products-toolbar-checkbox">
      <input
        type="checkbox"
        checked={lowStockOnly}
        onChange={(e) => setLowStockOnly(e.target.checked)}
      />
      បង្ហាញតែស្តុកជិតអស់
    </label>
  </div>

  <DataTable
    columns={columns}
    data={products}
    isLoading={isLoading}
    emptyIcon={Package}
    emptyTitle="មិនទាន់មានផលិតផល"
    emptyDescription="សូមបន្ថែមផលិតផលដំបូង ដើម្បីចាប់ផ្តើមការលក់។"
  />

  <ProductFormModal
    isOpen={isFormOpen}
    onClose={() => setIsFormOpen(false)}
    product={editingProduct}
    categories={categories}
    onSaved={() => {
      setIsFormOpen(false);
      fetchProducts();
    }}
  />

  <StockAdjustModal
    isOpen={!!adjustingProduct}
    onClose={() => setAdjustingProduct(null)}
    product={adjustingProduct}
    onSaved={() => {
      setAdjustingProduct(null);
      fetchProducts();
    }}
  />

  <ConfirmDialog
    isOpen={!!deletingProduct}
    onClose={() => setDeletingProduct(null)}
    onConfirm={handleDelete}
    isLoading={isDeleting}
    title="លុបផលិតផល"
    message={`តើអ្នកពិតជាចង់លុប "${deletingProduct?.name}" មែនទេ? ផលិតផលដែលមានប្រវត្តិការលក់ ឬការបញ្ជាទិញ មិនអាចលុបបានទេ។ សូមបិទការប្រើប្រាស់ផលិតផលនេះជំនួសវិញ។`}
  />
</div>
  );
}