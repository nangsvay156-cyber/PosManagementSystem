import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { saleService } from '../../services/saleService';
import '../../css/Invoice.css';

const fmt = (n) =>
  Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

const paymentLabel = {
  cash: 'Cash',
  card: 'Card',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  credit: 'Credit',
};

/* ── Edit to match your store ── */
const STORE = {
  name: 'My Store',
  address: '123 Main Street, City',
  phone: '+1 (555) 000-0000',
  email: 'store@example.com',
  taxId: 'TAX-0000000',
};

export default function InvoicePrint() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const data = await saleService.getInvoiceData(id);
        setSale(data);
      } catch (e) {
        setError(e.message ?? 'Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-ink-500">
      <Loader2 className="animate-spin mr-2" size={20} /> Loading invoice…
    </div>
  );
  if (error) return (
    <div className="flex h-screen items-center justify-center text-red-500">{error}</div>
  );
  if (!sale) return null;

  const isPaid = sale.payment_status === 'paid';

  // ✅ Sequelize returns User, Customer, items[].Product
  const cashierName = sale.User?.full_name ?? '—';
  const customer    = sale.Customer ?? null;
  const items       = sale.items ?? [];

  return (
    <>
      {/* Toolbar — hidden when printing */}
      <div className="no-print flex items-center justify-between border-b border-ink-100 bg-white px-6 py-3 shadow-sm">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-mint-500 px-4 py-2 text-sm font-semibold text-white hover:bg-mint-600 transition-colors"
        >
          <Printer size={16} /> Print Invoice
        </button>
      </div>

      {/* Invoice sheet */}
      <div className="invoice-page bg-white" ref={printRef}>

        {/* Header */}
        <div className="inv-header">
          <div className="inv-store">
            <h1 className="inv-store-name">{STORE.name}</h1>
            <p>{STORE.address}</p>
            <p>{STORE.phone} · {STORE.email}</p>
            {STORE.taxId && <p className="inv-taxid">Tax ID: {STORE.taxId}</p>}
          </div>
          <div className="inv-meta">
            <div className="inv-invoice-label">INVOICE</div>
            <table className="inv-meta-table">
              <tbody>
                <tr>
                  <td>Invoice No.</td>
                  <td className="inv-mono">{sale.invoice_number}</td>
                </tr>
                <tr>
                  <td>Date</td>
                  <td>{fmtDate(sale.created_at)}</td>
                </tr>
                <tr>
                  <td>Cashier</td>
                  <td>{cashierName}</td>
                </tr>
                <tr>
                  <td>Payment</td>
                  <td>{paymentLabel[sale.payment_method] ?? sale.payment_method}</td>
                </tr>
                <tr>
                  <td>Status</td>
                  <td>
                    <span className={`inv-badge ${isPaid ? 'inv-badge-paid' : 'inv-badge-unpaid'}`}>
                      {sale.payment_status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="inv-divider" />

        {/* Bill To — only shown when a customer is attached */}
        {customer && (
          <div className="inv-bill-to">
            <p className="inv-section-label">Bill To</p>
            <p className="inv-customer-name">{customer.name}</p>
            {customer.phone && <p>{customer.phone}</p>}
            {customer.email && <p>{customer.email}</p>}
            {customer.address && <p>{customer.address}</p>}
          </div>
        )}

        {/* Items table */}
        <table className="inv-items">
          <thead>
            <tr>
              <th className="inv-th-left">#</th>
              <th className="inv-th-left">Item</th>
              <th className="inv-th-left">SKU</th>
              <th className="inv-th-right">Qty</th>
              <th className="inv-th-right">Unit Price</th>
              <th className="inv-th-right">Discount</th>
              <th className="inv-th-right">Tax</th>
              <th className="inv-th-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'inv-row-even' : ''}>
                <td className="inv-td-muted">{idx + 1}</td>
                <td className="inv-td-name">{item.Product?.name ?? '—'}</td>
                <td className="inv-td-muted inv-mono">{item.Product?.sku ?? '—'}</td>
                <td className="inv-td-right">{item.quantity}</td>
                <td className="inv-td-right">${fmt(item.unit_price)}</td>
                <td className="inv-td-right">
                  {Number(item.discount_amount) > 0 ? `-$${fmt(item.discount_amount)}` : '—'}
                </td>
                <td className="inv-td-right">
                  {Number(item.tax_percent) > 0 ? `${item.tax_percent}%` : '—'}
                </td>
                <td className="inv-td-right inv-td-bold">${fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="inv-totals-wrap">
          <table className="inv-totals">
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td>${fmt(sale.subtotal)}</td>
              </tr>
              {Number(sale.discount_amount) > 0 && (
                <tr className="inv-discount-row">
                  <td>Discount</td>
                  <td>-${fmt(sale.discount_amount)}</td>
                </tr>
              )}
              {Number(sale.tax_amount) > 0 && (
                <tr>
                  <td>Tax</td>
                  <td>${fmt(sale.tax_amount)}</td>
                </tr>
              )}
              <tr className="inv-total-row">
                <td>Total</td>
                <td>${fmt(sale.total_amount)}</td>
              </tr>
              <tr>
                <td>Amount Paid</td>
                <td>${fmt(sale.amount_paid)}</td>
              </tr>
              {Number(sale.change_due) > 0 && (
                <tr className="inv-change-row">
                  <td>Change Due</td>
                  <td>${fmt(sale.change_due)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Note */}
        {sale.note && (
          <div className="inv-note">
            <span className="inv-section-label">Note: </span>{sale.note}
          </div>
        )}

        {/* Footer */}
        <div className="inv-footer">
          <p>Thank you for your purchase!</p>
          <p className="inv-footer-sub">
            Questions? Contact us at {STORE.email} · {STORE.phone}
          </p>
        </div>
      </div>

     
    </>
  );
}