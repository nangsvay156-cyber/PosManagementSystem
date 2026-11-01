import { useState, useCallback, useMemo } from 'react';

const TAX_RATE = 0.10; // flat 10% tax on all products

/**
 * Cart line shape: { product, quantity, unit_price, tax_percent, discount_amount }
 * unit_price defaults from the product but can be overridden per-line.
 * discount_amount is treated as a PERCENT (e.g. 10 = 10% off), not a dollar amount.
 */
export default function useCart() {
  const [lines, setLines] = useState([]);

  const addProduct = useCallback((product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        // Don't silently exceed available stock
        if (existing.quantity + 1 > product.stock_quantity) return prev;
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      if (product.stock_quantity < 1) return prev;
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: Number(product.selling_price),
          tax_percent: Number(product.tax_percent),
          discount_amount: Number(product.discount), // percent, e.g. 10 = 10%
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.product.id === productId
            ? { ...l, quantity: Math.min(Math.max(quantity, 1), l.product.stock_quantity) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const removeLine = useCallback((productId) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    for (const line of lines) {
      const gross = line.unit_price * line.quantity;
      const discountAmt = gross * (line.discount_amount / 100); // % -> $ for this line
      const afterDiscount = Math.max(gross - discountAmt, 0);
      const tax = afterDiscount * TAX_RATE;

      subtotal += gross;
      discountTotal += discountAmt;
      taxTotal += tax;
    }

    const total = Math.max(subtotal - discountTotal + taxTotal, 0);

    return {
      subtotal: round2(subtotal),
      taxTotal: round2(taxTotal),
      discountTotal: round2(discountTotal),
      total: round2(total),
    };
  }, [lines]);

  return { lines, addProduct, updateQuantity, removeLine, clearCart, totals };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}