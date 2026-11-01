import { useState, useEffect, useRef, useCallback } from 'react';
import { ScanLine, Search, ImageOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import useDebounce from '../../hooks/useDebounce';
import '../../css/ProductSearchPanel.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace(/\/api$/, '');

/* =========================
   PRODUCT TILE (OUTSIDE)
========================= */
function ProductTile({ product, onAdd }) {
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = !isOutOfStock && product.stock_quantity <= 5;

  const handleClick = () => {
    if (isOutOfStock) return;

    onAdd(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 420);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isOutOfStock}
      aria-label={
        isOutOfStock
          ? `${product.name} អស់ពីស្តុក`
          : `បន្ថែម ${product.name} តម្លៃ $${Number(product.selling_price).toFixed(2)}`
      }
      className={`psp-tile${isOutOfStock ? ' psp-tile-disabled' : ''}`}
    >
      <div className="psp-tile-image-wrap">
        {product.image ? (
          <img
            src={`${API_ORIGIN}${product.image}`}
            alt=""
            className="psp-tile-image"
          />
        ) : (
          <ImageOff size={24} className="psp-tile-noimage" />
        )}

        {isOutOfStock ? (
          <span className="psp-badge psp-badge-out">អស់ពីស្តុក</span>
        ) : isLowStock ? (
          <span className="psp-badge psp-badge-low">
            នៅសល់ {product.stock_quantity}
          </span>
        ) : null}

        <div className={`psp-added-overlay${justAdded ? ' visible' : ''}`}>
          <Check
            size={26}
            strokeWidth={3}
            className={`psp-added-icon${justAdded ? ' visible' : ''}`}
          />
        </div>
      </div>

      <div className="psp-tile-info">
        <p className="psp-tile-name">{product.name}</p>

        <div className="psp-tile-bottom-row">
          <span className="psp-tile-price">
            ${Number(product.selling_price).toFixed(2)}
          </span>

          {!isOutOfStock && !isLowStock && (
            <span className="psp-tile-stock">
              នៅសល់ {product.stock_quantity}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function ProductSearchPanel({ onAddProduct, stockUpdates }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(async (term) => {
    setIsLoading(true);
    try {
      const res = await productService.getAll({
        search: term || undefined,
        is_active: 'true',
        limit: 40,
      });

      setProducts(res.data);
    } catch {
      toast.error('មិនអាចផ្ទុកផលិតផលបានទេ។');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  // Patch stock levels in place whenever a sale completes,
  // without waiting on the debounced search or refetching the whole list.
  useEffect(() => {
    if (!stockUpdates || Object.keys(stockUpdates).length === 0) return;

    setProducts((prev) =>
      prev.map((p) =>
        Object.prototype.hasOwnProperty.call(stockUpdates, p.id)
          ? { ...p, stock_quantity: stockUpdates[p.id] }
          : p
      )
    );
  }, [stockUpdates]);

  const handleKeyDown = async (e) => {
    if (e.key !== 'Enter' || !query.trim()) return;

    e.preventDefault();

    try {
      const res = await productService.getByBarcode(query.trim());
      onAddProduct(res.data);
      setQuery('');
      toast.success(`បានបន្ថែម ${res.data.name}`);
    } catch {
      // fallback to search list
    }
  };

  return (
    <div className="psp-wrap">
      <div className="psp-search-row">
        <ScanLine size={18} className="psp-search-icon" />

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ស្កេនបាកូដ ឬស្វែងរកផលិតផល..."
          className="psp-search-input"
        />
      </div>

      <div className="psp-grid-scroll">
        <div className="psp-grid">
          {isLoading && products.length === 0 && (
            <p className="psp-full-row psp-loading-text">
              កំពុងផ្ទុកផលិតផល...
            </p>
          )}

          {!isLoading && products.length === 0 && (
            <div className="psp-full-row psp-empty">
              <Search size={28} className="psp-empty-icon" />
              <p className="psp-empty-text">មិនមានផលិតផលទេ។</p>
            </div>
          )}

          {products.map((product) => (
            <ProductTile
              key={product.id}
              product={product}
              onAdd={onAddProduct}
            />
          ))}
        </div>
      </div>
    </div>
  );
}