import { Minus, Plus, Trash2, Receipt, UserPlus, X } from 'lucide-react';
import Button from '../ui/Button';
import '../../css/CartPanel.css';

function TornEdge() {
  return (
    <svg width="100%" height="8" viewBox="0 0 300 8" preserveAspectRatio="none" className="cart-torn-edge" aria-hidden="true">
      <path
        d="M0 8 L7.5 0 L15 8 L22.5 0 L30 8 L37.5 0 L45 8 L52.5 0 L60 8 L67.5 0 L75 8 L82.5 0 L90 8 L97.5 0 L105 8 L112.5 0 L120 8 L127.5 0 L135 8 L142.5 0 L150 8 L157.5 0 L165 8 L172.5 0 L180 8 L187.5 0 L195 8 L202.5 0 L210 8 L217.5 0 L225 8 L232.5 0 L240 8 L247.5 0 L255 8 L262.5 0 L270 8 L277.5 0 L285 8 L292.5 0 L300 8"
        fill="#f5f5f5"
      />
    </svg>
  );
}

export default function CartPanel({ cart, customer, onClearCustomer, onPickCustomer, onCheckout }) {
  const { lines, updateQuantity, removeLine, clearCart, totals } = cart;

  return (
    <div className="cart-panel">
      <TornEdge />

      <div className="cart-body">
        <div className="cart-header">
          <h3 className="cart-header-title">
            <Receipt size={18} />
            ការលក់បច្ចុប្បន្ន
          </h3>

          {lines.length > 0 && (
            <button onClick={clearCart} className="cart-clear-btn">
              លុបទាំងអស់
            </button>
          )}
        </div>

        <button onClick={customer ? onClearCustomer : onPickCustomer} className="cart-customer-btn">
          {customer ? (
            <>
              <span className="cart-customer-name">{customer.name}</span>
              <X size={14} className="cart-customer-clear-icon" />
            </>
          ) : (
            <span className="cart-customer-placeholder">
              <UserPlus size={15} /> ជ្រើសរើសអតិថិជន (ជាជម្រើស)
            </span>
          )}
        </button>

        <div className="cart-divider" />

        <div className="cart-lines">
          {lines.length === 0 && (
            <div className="cart-empty">
              <Receipt size={32} className="cart-empty-icon" />
              <p className="cart-empty-text">
                មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ។ សូមជ្រើសរើសផលិតផលដើម្បីបន្ថែម។
              </p>
            </div>
          )}

          {lines.map((line) => {
            const lineGross = line.unit_price * line.quantity;
            const lineAfterDiscount = Math.max(lineGross - line.discount_amount, 0);
            const lineTax = lineAfterDiscount * 0.10; // flat 10% tax on all products
            const lineTotal = lineAfterDiscount + lineTax;

            return (
              <div key={line.product.id} className="cart-line">
                <div className="cart-line-top">
                  <p className="cart-line-name">{line.product.name}</p>

                  <button
                    onClick={() => removeLine(line.product.id)}
                    className="cart-line-remove"
                    aria-label={`លុប ${line.product.name} ចេញពីកន្ត្រក`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="cart-line-bottom">
                  <p className="cart-line-unit-price">
                    ${line.unit_price.toFixed(2)} / កែវ
                  </p>

                  <div className="cart-line-qty-controls">
                    <button
                      onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                      className="cart-qty-btn"
                      aria-label={`ដក ${line.product.name} មួយ`}
                    >
                      <Minus size={12} />
                    </button>

                    <span className="cart-line-qty">{line.quantity}</span>

                    <button
                      onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                      disabled={line.quantity >= line.product.stock_quantity}
                      className="cart-qty-btn"
                      aria-label={`បន្ថែម ${line.product.name} មួយ`}
                    >
                      <Plus size={12} />
                    </button>

                    <span className="cart-line-total">
                      ${lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-divider" />

        <div className="cart-summary">
          <div className="cart-summary-rows">
            <Row label="សរុបរង" value={totals.subtotal} />
            <Row label="ពន្ធ(10%)" value={totals.taxTotal} />
          </div>

          <div className="cart-summary-divider" />

          <div className="cart-total-row">
            <span className="cart-total-label">សរុបត្រូវបង់</span>
            <span className="cart-total-value">
              ${totals.total.toFixed(2)}
            </span>
          </div>

          <Button
            size="lg"
            className="cart-checkout-btn"
            disabled={lines.length === 0}
            onClick={onCheckout}
          >
            បង់ប្រាក់ ${totals.total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="cart-summary-row">
      <span>{label}</span>
      <span>${value.toFixed(2)}</span>
    </div>
  );
}