import { useState } from 'react';
import toast from 'react-hot-toast';
import useCart from '../../hooks/useCart';
import ProductSearchPanel from '../../components/sales/ProductSearchPanel';
import CartPanel from '../../components/sales/CartPanel';
import CheckoutModal from '../../components/sales/CheckoutModal';
import CustomerPickerModal from '../../components/sales/CustomerPickerModal';
import SaleSuccessModal from '../../components/sales/SaleSuccessModal';
import '../../css/Sales.css';

export default function Sales() {
  const cart = useCart();
  const [customer, setCustomer] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [stockUpdates, setStockUpdates] = useState({}); // { [productId]: newStockQuantity }

  const handleAddProduct = (product) => {
    if (product.stock_quantity <= 0) {
      toast.error(`${product.name} is out of stock.`);
      return;
    }
    cart.addProduct(product);
  };

  return (
    <div className="sales-layout">
      <div className="sales-panel">
        <ProductSearchPanel
          onAddProduct={handleAddProduct}
          stockUpdates={stockUpdates}
        />
      </div>
      <div className="sales-panel">
        <CartPanel
          cart={cart}
          customer={customer}
          onClearCustomer={() => setCustomer(null)}
          onPickCustomer={() => setIsCustomerPickerOpen(true)}
          onCheckout={() => setIsCheckoutOpen(true)}
        />
      </div>
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        customer={customer}
        onCompleted={(sale) => {
          setIsCheckoutOpen(false);
          setCompletedSale(sale);
          cart.clear?.(); // clear cart after a completed sale, if your hook supports it

          if (sale?.updatedProducts?.length) {
            setStockUpdates((prev) => {
              const next = { ...prev };
              sale.updatedProducts.forEach((p) => {
                next[p.id] = p.stock_quantity;
              });
              return next;
            });
          }
        }}
        title="បង់ប្រាក់"
      />
      <CustomerPickerModal
        isOpen={isCustomerPickerOpen}
        onClose={() => setIsCustomerPickerOpen(false)}
        onSelect={(c) => {
          setCustomer(c);
          setIsCustomerPickerOpen(false);
        }}
        title="ជ្រើសរើសអតិថិជន"
      />
      <SaleSuccessModal
        sale={completedSale}
        onClose={() => setCompletedSale(null)}
        onNewSale={() => {
          setCompletedSale(null);
          setCustomer(null);
        }}
        title="ការលក់ជោគជ័យ"
      />
    </div>
  );
}