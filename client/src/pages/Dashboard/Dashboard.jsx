import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, TrendingUp, Package, AlertTriangle,
  Plus, SlidersHorizontal, ClipboardList, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { saleService } from '../../services/saleService';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import '../../css/Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Fetch sales, a broad product list (for low-stock filtering), and customers in parallel.
        // We deliberately avoid passing low_stock=true to the API because the backend
        // productController currently references a non-existent column 'low_stock_threshold'
        // instead of the correct 'low_stock_alert' — so we filter client-side instead.
        const [salesRes, productsRes, customersRes] = await Promise.all([
          saleService.getAll({ limit: 50, sort: 'created_at', order: 'desc' }),
          productService.getAll({ limit: 200, is_active: 'true' }),
          customerService.getAll({ limit: 1 }),
        ]);

        const sales = salesRes.data ?? [];
        const products = productsRes.data ?? [];

        const todaySales = sales.filter((s) => {
          const d = new Date(s.created_at);
          const now = new Date();
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
          );
        });

        // Filter low stock client-side: stock_quantity <= low_stock_alert
        const lowStock = products
          .filter((p) => p.stock_quantity <= p.low_stock_alert)
          .slice(0, 5);

        setStats({
          todayRevenue: todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0),
          todaySalesCount: todaySales.length,
          totalProducts: products.length,
          totalCustomers: customersRes.meta?.total ?? customersRes.total ?? '—',
        });

        setRecentSales(sales.slice(0, 6));
        setLowStockItems(lowStock);
      } catch {
        toast.error('Could not load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const kpiCards = [
  {
    label: 'ចំណូលថ្ងៃនេះ',
    value: stats ? `$${stats.todayRevenue.toFixed(2)}` : null,
    icon: TrendingUp,
    iconColor: 'amber',
    footer: 'ពីការលក់ដែលបានបញ្ចប់នៅថ្ងៃនេះ',
  },
  {
    label: 'ការលក់ថ្ងៃនេះ',
    value: stats ? String(stats.todaySalesCount) : null,
    icon: ShoppingCart,
    iconColor: 'green',
    footer: 'ចំនួនប្រតិបត្តិការលក់',
  },
  {
    label: 'ផលិតផលសរុប',
    value: stats ? String(stats.totalProducts) : null,
    icon: Package,
    iconColor: 'blue',
    footer: 'នៅក្នុងបញ្ជីផលិតផល',
  },
  {
    label: 'ការជូនដំណឹងស្តុកទាប',
    value: stats ? String(lowStockItems.length) : null,
    icon: AlertTriangle,
    iconColor: 'rose',
    footer: 'ផលិតផលដែលត្រូវបំពេញស្តុក',
  },
];
  const quickActions = [
    { label: 'New sale', icon: ShoppingCart, iconColor: 'amber', path: '/sales' },
    { label: 'Add product', icon: Plus, iconColor: 'ink', path: '/products' },
    { label: 'New purchase order', icon: ClipboardList, iconColor: 'blue', path: '/purchase-orders' },
    { label: 'Adjust stock', icon: SlidersHorizontal, iconColor: 'green', path: '/products' },
    { label: 'Add customer', icon: Users, iconColor: 'ink', path: '/customers' },
  ];

  return (
    <div>
  {/* Welcome */}
  <div className="dash-welcome">
    <h2 className="dash-welcome-title">
      {greeting()}, {user?.full_name?.split(" ")[0]}។
    </h2>
    <p className="dash-welcome-sub">
      <span>{today}</span> — នេះគឺជាស្ថានភាពហាងរបស់អ្នកនៅថ្ងៃនេះ។
    </p>
  </div>

  {/* KPI cards */}
  <div className="dash-kpi-grid">
    {kpiCards.map(({ label, value, icon: Icon, iconColor, footer }) => (
      <div key={label} className="dash-kpi-card">
        <div className="dash-kpi-top">
          <p className="dash-kpi-label">{label}</p>
          <div className={`dash-kpi-icon ${iconColor}`}>
            <Icon size={17} strokeWidth={2.25} />
          </div>
        </div>

        {isLoading || value === null ? (
          <div>
            <div className="dash-skeleton dash-kpi-skeleton-value" />
            <div className="dash-skeleton dash-kpi-skeleton-footer" />
          </div>
        ) : (
          <>
            <p className={`dash-kpi-value${value.length > 7 ? " small" : ""}`}>
              {value}
            </p>
            <p className="dash-kpi-footer">{footer}</p>
          </>
        )}
      </div>
    ))}
  </div>

  {/* Main content */}
  <div className="dash-grid">
    {/* Recent sales */}
    <div className="dash-card">
      <div className="dash-card-header">
        <h3 className="dash-card-title">ការលក់ថ្មីៗ</h3>

        <button
          className="dash-card-link"
          onClick={() => navigate("/sales")}
        >
          ទៅកាន់ POS →
        </button>
      </div>

      <div className="dash-card-body">
        {isLoading ? (
          <p className="dash-empty-row">កំពុងផ្ទុក...</p>
        ) : recentSales.length === 0 ? (
          <p className="dash-empty-row">
            មិនទាន់មានការលក់នៅថ្ងៃនេះទេ។
          </p>
        ) : (
          recentSales.map((sale) => (
            <div key={sale.id} className="dash-sale-row">
              <div>
                <p className="dash-sale-invoice">
                  {sale.invoice_number}
                </p>

                <p className="dash-sale-customer">
                  {sale.Customer?.name || "អតិថិជនទូទៅ"}
                </p>
              </div>

              <div className="dash-sale-right">
                <p className="dash-sale-amount">
                  ${Number(sale.total_amount).toFixed(2)}
                </p>

                <p className="dash-sale-time">
                  {new Date(sale.created_at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Right column */}
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Low stock */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">ស្តុកទាប</h3>

          <button
            className="dash-card-link"
            onClick={() => navigate("/products")}
          >
            មើលទាំងអស់ →
          </button>
        </div>

        <div className="dash-card-body">
          {isLoading ? (
            <p className="dash-empty-row">កំពុងផ្ទុក...</p>
          ) : lowStockItems.length === 0 ? (
            <p className="dash-empty-row">
              ស្តុកផលិតផលទាំងអស់គ្រប់គ្រាន់។
            </p>
          ) : (
            lowStockItems.map((p) => (
              <div key={p.id} className="dash-stock-row">
                <div>
                  <p className="dash-stock-name">{p.name}</p>
                  <p className="dash-stock-sku">{p.sku}</p>
                </div>

                <span className="dash-stock-qty">
                  {p.stock_quantity} {p.unit}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">សកម្មភាពរហ័ស</h3>
        </div>

        <div className="dash-card-body">
          <div className="dash-quick-actions">
            {quickActions.map(({ label, icon: Icon, iconColor, path }) => (
              <button
                key={label}
                className="dash-quick-btn"
                onClick={() => navigate(path)}
              >
                <span className={`dash-quick-btn-icon ${iconColor}`}>
                  <Icon size={16} strokeWidth={2.25} />
                </span>

                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}