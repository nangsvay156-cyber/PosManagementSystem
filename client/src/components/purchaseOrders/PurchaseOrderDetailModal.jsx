import { useEffect, useState } from 'react';
import { PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { PageSpinner } from '../ui/Feedback';
import '../../css/PurchaseOrderDetailModal.css';

const statusVariant = { pending: 'neutral', ordered: 'info', received: 'success', cancelled: 'danger' };

export default function PurchaseOrderDetailModal({ orderId, onClose, onUpdated }) {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [receiveQty, setReceiveQty] = useState({}); // { product_id: quantity }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrder = () => {
    if (!orderId) return;
    setIsLoading(true);
    purchaseOrderService
      .getById(orderId)
      .then((res) => {
        setOrder(res.data);
        setReceiveQty({});
      })
      .catch(() => toast.error('Could not load purchase order.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const canReceive = order && order.status !== 'received' && order.status !== 'cancelled';

  const handleMarkOrdered = async () => {
    setIsSubmitting(true);
    try {
      await purchaseOrderService.updateStatus(order.id, 'ordered');
      toast.success('Marked as ordered.');
      loadOrder();
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      await purchaseOrderService.updateStatus(order.id, 'cancelled');
      toast.success('Purchase order cancelled.');
      loadOrder();
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async () => {
    const items = Object.entries(receiveQty)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([product_id, qty]) => ({ product_id: Number(product_id), quantity_received: Number(qty) }));

    if (items.length === 0) {
      toast.error('Enter a quantity to receive for at least one item.');
      return;
    }

    setIsSubmitting(true);
    try {
      await purchaseOrderService.receive(order.id, items);
      toast.success('Stock received and added to inventory.');
      loadOrder();
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not receive items.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={!!orderId}
      onClose={onClose}
      title={order ? `ការបញ្ជាទិញ ${order.po_number}` : "ការបញ្ជាទិញ"}
      size="lg"
    >
      {isLoading || !order ? (
        <PageSpinner />
      ) : (
        <div className="pod-body">
          <div className="pod-header-row">
            <div>
              <p className="pod-supplier-label">អ្នកផ្គត់ផ្គង់</p>
              <p className="pod-supplier-name">{order.Supplier?.name}</p>
            </div>
            <Badge variant={statusVariant[order.status]}>
              {order.status === "pending"
                ? "រង់ចាំ"
                : order.status === "ordered"
                ? "បានបញ្ជាទិញ"
                : order.status === "received"
                ? "បានទទួល"
                : order.status === "cancelled"
                ? "បានបោះបង់"
                : order.status}
            </Badge>
          </div>

          <div className="pod-table-wrap">
            <table className="pod-table">
              <thead>
                <tr>
                  <th>ផលិតផល</th>
                  <th className="align-right">បានបញ្ជាទិញ</th>
                  <th className="align-right">បានទទួល</th>
                  <th className="align-right">តម្លៃដើម</th>
                  {canReceive && (
                    <th className="align-right">ទទួលឥឡូវនេះ</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {order.items.map((item) => {
                  const remaining = item.quantity_ordered - item.quantity_received;

                  return (
                    <tr key={item.id}>
                      <td>
                        <p className="pod-product-name">
                          {item.Product?.name}
                        </p>
                        <p className="pod-product-sku">
                          {item.Product?.sku}
                        </p>
                      </td>

                      <td className="align-right">{item.quantity_ordered}</td>

                      <td className="align-right">
                        <span
                          className={
                            item.quantity_received >= item.quantity_ordered
                              ? "pod-received-full"
                              : ""
                          }
                        >
                          {item.quantity_received}
                        </span>
                      </td>

                      <td className="align-right">
                        ${Number(item.unit_cost).toFixed(2)}
                      </td>

                      {canReceive && (
                        <td className="align-right">
                          {remaining > 0 ? (
                            <Input
                              type="number"
                              min="0"
                              max={remaining}
                              placeholder={`អតិបរមា ${remaining}`}
                              className="pod-receive-input"
                              value={receiveQty[item.product_id] ?? ""}
                              onChange={(e) =>
                                setReceiveQty((prev) => ({
                                  ...prev,
                                  [item.product_id]: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <span className="pod-fully-received">
                              បានទទួលគ្រប់ចំនួន
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pod-total-row">
            <span className="pod-total-label">
              តម្លៃសរុបនៃការបញ្ជាទិញ
            </span>
            <span className="pod-total-value">
              ${Number(order.total_amount).toFixed(2)}
            </span>
          </div>

          {canReceive && (
            <div className="pod-actions">
              {order.status === "pending" && (
                <Button
                  variant="outline"
                  onClick={handleMarkOrdered}
                  loading={isSubmitting}
                >
                  បញ្ជាក់ថាបានបញ្ជាទិញ
                </Button>
              )}

              <Button
                variant="danger"
                onClick={handleCancel}
                loading={isSubmitting}
              >
                បោះបង់ការបញ្ជាទិញ
              </Button>

              <Button
                icon={PackageCheck}
                onClick={handleReceive}
                loading={isSubmitting}
              >
                ទទួលស្តុក
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}