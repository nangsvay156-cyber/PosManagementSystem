import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Banknote, Smartphone, Landmark, Receipt, Coins } from 'lucide-react';
import { saleService } from '../../services/saleService';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import '../../css/CheckoutModal.css';

// TODO: move to settings/config if this needs to change without a code edit
const EXCHANGE_RATE = 4100; // 1 USD = 4,100 KHR

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'mobile_money', label: 'Mobile money', icon: Smartphone },
  { value: 'bank_transfer', label: 'Bank transfer', icon: Landmark },
  { value: 'credit', label: 'On credit', icon: Receipt },
];

function formatKHR(usdAmount) {
  const riel = Math.round(usdAmount * EXCHANGE_RATE);
  return `${riel.toLocaleString('en-US')}៛`;
}

export default function CheckoutModal({ isOpen, onClose, cart, customer, onCompleted }) {
  const { lines, totals, clearCart } = cart;
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [usdPaid, setUsdPaid] = useState('');
  const [khrPaid, setKhrPaid] = useState('0');
  const [orderDiscount, setOrderDiscount] = useState('0'); // percent, e.g. 10 = 10%
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCredit = paymentMethod === 'credit';
  const isCash = paymentMethod === 'cash';

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash');
      setUsdPaid(totals.total.toFixed(2));
      setKhrPaid('0');
      setOrderDiscount('0');
    }
  }, [isOpen, totals.total]);

  const discountPercent = Math.min(Math.max(Number(orderDiscount) || 0, 0), 100);
  const discountAmount = totals.total * (discountPercent / 100);
  const effectiveTotal = Math.max(totals.total - discountAmount, 0);

  // Only cash accepts a KHR split; other methods are assumed paid in USD only.
  const usdFromKhr = isCash ? (Number(khrPaid || 0) / EXCHANGE_RATE) : 0;
  const totalPaidUsd = (Number(usdPaid || 0)) + usdFromKhr;
  const changeDue = Math.max(totalPaidUsd - effectiveTotal, 0);

  const canConfirm = isCredit || totalPaidUsd + 0.005 >= effectiveTotal;

  const handleConfirm = async () => {
    if (!canConfirm) {
      toast.error('ចំនួនទឹកប្រាក់ទទួលមិនគ្រប់ចំនួនត្រូវបង់ទេ។');
      return;
    }

    setIsSubmitting(true);
    try {
     const res = await saleService.create({
  customer_id: customer?.id || null,
  items: lines.map((l) => {
    const gross = l.unit_price * l.quantity;
    const lineDiscountDollar = gross * (l.discount_amount / 100); // % -> $ for the backend
    return {
      product_id: l.product.id,
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_percent: 10, // flat 10% — matches useCart's TAX_RATE, not product.tax_percent
      discount_amount: Math.round(lineDiscountDollar * 100) / 100,
    };
  }),
  discount_amount: discountAmount,
  amount_paid: isCredit ? Number(usdPaid) || 0 : totalPaidUsd,
  payment_method: paymentMethod,
  payment_detail: isCash
    ? { usd: Number(usdPaid) || 0, khr: Number(khrPaid) || 0, exchange_rate: EXCHANGE_RATE }
    : undefined,
});

      toast.success(`Sale completed — ${res.data.invoice_number}`);
      clearCart();
      onCompleted(res.data);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not complete sale.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="បញ្ចប់ការលក់"
      size="md"
    >
      <div className="checkout-body">
        <div>
          <p className="checkout-section-label">វិធីសាស្ត្រទូទាត់</p>

          <div className="checkout-payment-grid">
            {paymentMethods.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setPaymentMethod(value)}
                className={`checkout-payment-btn${
                  paymentMethod === value ? " selected" : ""
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="បញ្ចុះតម្លៃ (%)"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={orderDiscount}
          onChange={(e) => setOrderDiscount(e.target.value)}
        />

        {isCash ? (
          <div>
            <p className="checkout-section-label">ចំនួនទឹកប្រាក់ដែលបានទទួល</p>
            <div className="checkout-grid-2">
              <Input
                label="ដុល្លារ (USD)"
                type="number"
                min="0"
                step="0.01"
                value={usdPaid}
                onChange={(e) => setUsdPaid(e.target.value)}
              />
              <Input
                label="រៀល (KHR)"
                type="number"
                min="0"
                step="100"
                value={khrPaid}
                onChange={(e) => setKhrPaid(e.target.value)}
              />
            </div>
            <p className="checkout-exchange-note">
              <Coins size={12} /> អត្រាប្តូរប្រាក់: $1 = {EXCHANGE_RATE.toLocaleString('en-US')}៛
            </p>
          </div>
        ) : (
          <Input
            label={isCredit ? "ចំនួនទឹកប្រាក់ដែលបានបង់ (ជាជម្រើស)" : "ចំនួនទឹកប្រាក់ដែលបានទទួល"}
            type="number"
            min="0"
            step="0.01"
            value={usdPaid}
            onChange={(e) => setUsdPaid(e.target.value)}
          />
        )}

        {isCredit && !customer && (
          <p className="checkout-credit-note">
            ការលក់ជំពាក់គួរតែភ្ជាប់ជាមួយអតិថិជន ដើម្បីអាចតាមដានចំនួនទឹកប្រាក់ដែលជំពាក់បាន។ ទោះយ៉ាងណា អ្នកនៅតែអាចបន្តដោយមិនជ្រើសរើសអតិថិជន។
          </p>
        )}

        <div className="checkout-summary">
          <Row label="សរុបទំនិញ" value={totals.total} />
          <Row label="បញ្ចុះតម្លៃសរុប" value={-discountAmount} />

          <div className="checkout-due-row">
            <span>សរុបត្រូវបង់</span>
            <div className="checkout-due-amounts">
              <span className="checkout-row-amount-khr">{formatKHR(effectiveTotal)}</span><br />
              <span className="checkout-row-amount">${effectiveTotal.toFixed(2)}</span>
            
            </div>
          </div>

          {!isCredit && (
            <div className="checkout-change-row">
              <span>ប្រាក់អាប់</span>
              <div className="checkout-due-amounts">
                <span className="checkout-row-amount-khr">{formatKHR(changeDue)}</span><br />
                <span className="checkout-row-amount">${changeDue.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="checkout-actions">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            បោះបង់
          </Button>

          <Button
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={!canConfirm}
          >
            បញ្ជាក់ការលក់
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <div className="checkout-row">
      <span>{label}</span>
      <span className="checkout-row-amount">${value.toFixed(2)}</span>
    </div>
  );
}