import { useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { reportService } from '../../services/reportService';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import { PageSpinner } from '../../components/ui/Feedback';
import '../../css/Reports.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [profit, setProfit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [salesRes, topRes, lowRes, profitRes] = await Promise.all([
        reportService.getSalesReport({ period }),
        reportService.getTopProducts({ limit: 8 }),
        reportService.getLowStock(),
        reportService.getProfit({}),
      ]);
      setSalesData(Array.isArray(salesRes.data) ? salesRes.data : []);
      setTopProducts(Array.isArray(topRes.data) ? topRes.data : []);
      setLowStock(Array.isArray(lowRes.data) ? lowRes.data : []);
      setProfit(profitRes.data ?? null);
    } catch {
      toast.error('Could not load reports.');
      setSalesData([]);
      setTopProducts([]);
      setLowStock([]);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (isLoading && salesData.length === 0) return <PageSpinner />;

  const totalRevenue = salesData.reduce((sum, d) => sum + Number(d.total_revenue || 0), 0);
  const totalSalesCount = salesData.reduce((sum, d) => sum + Number(d.total_sales || 0), 0);

  const chartData = {
    labels: salesData.map((d) => formatPeriodLabel(d.period, period)),
    datasets: [
      {
        label: 'Revenue',
        data: salesData.map((d) => Number(d.total_revenue || 0)),
        backgroundColor: '#f59e2c',
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `$${ctx.parsed.y.toFixed(2)}` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => `$${v}` },
        grid: { color: '#ece8e0' },
      },
      x: { grid: { display: false } },
    },
  };

  return (
   <div>
  <PageHeader
    title="របាយការណ៍"
    description="និន្នាការការលក់ ផលិតផលលក់ដាច់ ប្រាក់ចំណេញ និងស្ថានភាពស្តុក។"
    action={
      <Select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        containerClassName="select-period"
      >
        <option value="daily">ប្រចាំថ្ងៃ (30 ថ្ងៃ)</option>
        <option value="monthly">ប្រចាំខែ (12 ខែ)</option>
      </Select>
    }
  />

  <div className="stats-grid">
    <StatCard
      icon={DollarSign}
      label="ចំណូលក្នុងរយៈពេល"
      value={`$${totalRevenue.toFixed(2)}`}
    />

    <StatCard
      icon={TrendingUp}
      label="ចំនួនការលក់ក្នុងរយៈពេល"
      value={totalSalesCount}
    />

    <StatCard
      icon={DollarSign}
      label="ប្រាក់ចំណេញប៉ាន់ស្មាន (សរុប)"
      value={`$${Number(profit?.estimated_profit || 0).toFixed(2)}`}
      accent="mint"
    />

    <StatCard
      icon={AlertTriangle}
      label="ផលិតផលស្តុកទាប"
      value={lowStock.length}
      accent={lowStock.length > 0 ? "rose" : undefined}
    />
  </div>

  <Card className="section-spacing">
    <h3 className="card-heading">និន្នាការចំណូល</h3>

    <div className="chart-container">
      {salesData.length === 0 ? (
        <p className="chart-empty-state">
          មិនទាន់មានទិន្នន័យការលក់ក្នុងរយៈពេលនេះទេ។
        </p>
      ) : (
        <Bar data={chartData} options={chartOptions} />
      )}
    </div>
  </Card>

  <div className="tables-grid">
    <Card padded={false}>
      <h3 className="card-heading card-heading--padded">
        ផលិតផលលក់ដាច់ជាងគេ
      </h3>

      <div className="card-body--padded">
        <DataTable
          columns={[
            {
              key: "name",
              label: "ផលិតផល",
              render: (row) => row.Product?.name || `#${row.product_id}`,
            },
            {
              key: "qty",
              label: "បានលក់",
              className: "text-right-num",
              render: (row) => row.total_quantity_sold,
            },
            {
              key: "rev",
              label: "ចំណូល",
              className: "text-right-num",
              render: (row) =>
                `$${Number(row.total_revenue).toFixed(2)}`,
            },
          ]}
          data={topProducts}
          isLoading={false}
          emptyIcon={Package}
          emptyTitle="មិនទាន់មានការលក់"
        />
      </div>
    </Card>

    <Card padded={false}>
      <h3 className="card-heading card-heading--padded">
        ស្តុកទាប
      </h3>

      <div className="card-body--padded">
        <DataTable
          columns={[
            {
              key: "name",
              label: "ផលិតផល",
              render: (row) => row.name,
            },
            {
              key: "stock",
              label: "ស្តុក",
              className: "text-right-num",
              render: (row) => (
                <span className="low-stock-value">
                  {row.stock_quantity} {row.unit}
                </span>
              ),
            },
            {
              key: "alert",
              label: "កម្រិតជូនដំណឹង",
              className: "text-right-num",
              render: (row) => row.low_stock_alert,
            },
          ]}
          data={lowStock}
          isLoading={false}
          emptyIcon={AlertTriangle}
          emptyTitle="ស្តុកគ្រប់គ្រាន់"
          emptyDescription="មិនមានផលិតផលណាមួយទាបជាងកម្រិតជូនដំណឹងទេ។"
        />
      </div>
    </Card>
  </div>
</div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  const accentClass =
    accent === 'mint'
      ? 'stat-card__icon--mint'
      : accent === 'rose'
      ? 'stat-card__icon--rose'
      : '';

  return (
    <Card className="stat-card">
      <div className={`stat-card__icon ${accentClass}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="stat-card__value">{value}</p>
        <p className="stat-card__label">{label}</p>
      </div>
    </Card>
  );
}

function formatPeriodLabel(period, mode) {
  if (mode === 'monthly') {
    const [year, month] = period.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleDateString(undefined, {
      month: 'short',
      year: '2-digit',
    });
  }
  const d = new Date(period);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}