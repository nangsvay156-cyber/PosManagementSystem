import { useEffect, useState, useCallback } from 'react';
import { Plus, ClipboardList, PackageCheck, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import CreatePurchaseOrderModal from '../../components/purchaseOrders/CreatePurchaseOrderModal';
import PurchaseOrderDetailModal from '../../components/purchaseOrders/PurchaseOrderDetailModal';
import '../../css/PurchaseOrders.css';

const statusVariant = {
  pending: 'neutral',
  ordered: 'info',
  received: 'success',
  cancelled: 'danger',
};

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingOrderId, setViewingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await purchaseOrderService.getAll({ status: statusFilter || undefined, limit: 100 });
      setOrders(res.data);
    } catch {
      toast.error('Could not load purchase orders.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns = [
    { key: 'po_number', label: 'PO #', render: (row) => <span className="po-number">{row.po_number}</span> },
    { key: 'supplier', label: 'Supplier', render: (row) => row.Supplier?.name || '—' },
    {
      key: 'items',
      label: 'Items',
      className: 'text-right',
      render: (row) => row.items?.length ?? 0,
    },
    {
      key: 'total_amount',
      label: 'Total',
      className: 'text-right num',
      render: (row) => `$${Number(row.total_amount).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <div className="po-row-actions">
          <button onClick={() => setViewingOrderId(row.id)} className="po-icon-btn" title="View / receive">
            {row.status === 'received' || row.status === 'cancelled' ? <Eye size={15} /> : <PackageCheck size={15} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
  <PageHeader
    title="ការបញ្ជាទិញទំនិញ"
    description="បញ្ជាទិញ និងទទួលស្តុកពីអ្នកផ្គត់ផ្គង់។"
    action={
      <Button  onClick={() => setIsCreateOpen(true)}>
        បង្កើតការបញ្ជាទិញថ្មី
      </Button>
    }
  />

  <div className="po-filter-wrap">
    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
      <option value="">ស្ថានភាពទាំងអស់</option>
      <option value="pending">កំពុងរង់ចាំ</option>
      <option value="ordered">បានបញ្ជាទិញ</option>
      <option value="received">បានទទួល</option>
      <option value="cancelled">បានបោះបង់</option>
    </Select>
  </div>

  <DataTable
    columns={columns}
    data={orders}
    isLoading={isLoading}
    emptyIcon={ClipboardList}
    emptyTitle="មិនទាន់មានការបញ្ជាទិញ"
    emptyDescription="សូមបង្កើតការបញ្ជាទិញ ដើម្បីបំពេញស្តុកពីអ្នកផ្គត់ផ្គង់។"
  />

  <CreatePurchaseOrderModal
    isOpen={isCreateOpen}
    onClose={() => setIsCreateOpen(false)}
    onSaved={() => {
      setIsCreateOpen(false);
      fetchOrders();
    }}
  />

  <PurchaseOrderDetailModal
    orderId={viewingOrderId}
    onClose={() => setViewingOrderId(null)}
    onUpdated={fetchOrders}
  />
</div>
  );
}