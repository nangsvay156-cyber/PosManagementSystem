import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Truck,
  Users,
  Users2,
  ClipboardList,
  BarChart3,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../css/Sidebar.css';

const navItems = [
  { to: '/dashboard', label: 'ផ្ទាំងគ្រប់គ្រង', icon: LayoutDashboard, roles: ['admin', 'cashier'] },
  { to: '/sales', label: 'ការលក់ / POS', icon: ShoppingCart, roles: ['admin', 'cashier'] },
  { to: '/products', label: 'ផលិតផល', icon: Package, roles: ['admin', 'cashier'] },
  { to: '/categories', label: 'ប្រភេទផលិតផល', icon: Tags, roles: ['admin'] },
  { to: '/suppliers', label: 'អ្នកផ្គត់ផ្គង់', icon: Truck, roles: ['admin'] },
  { to: '/purchase-orders', label: 'ការបញ្ជាទិញ', icon: ClipboardList, roles: ['admin'] },
  { to: '/customers', label: 'អតិថិជន', icon: Users, roles: ['admin', 'cashier'] },
  { to: '/reports', label: 'របាយការណ៍', icon: BarChart3, roles: ['admin'] },
  { to: '/staff', label: 'បុគ្គលិក', icon: Users2, roles: ['admin'] },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Store size={18} strokeWidth={2.5} />
        </div>
       <div>
        <p className="sidebar-brand-name">ប្រព័ន្ធគ្រប់គ្រងការលក់ (POS)</p>
        <p className="sidebar-brand-subtitle">គ្រប់គ្រងការលក់ និងស្តុក</p>
      </div>
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {navItems
            .filter((item) => item.roles.includes(user?.role))
            .map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `sidebar-nav-link${isActive ? ' active' : ''}`
                  }
                >
                  <Icon size={18} strokeWidth={2} />
                  {label}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <p className="sidebar-footer-label">បានចូលប្រព័ន្ធគ្រប់គ្រង</p>
        <p className="sidebar-footer-name">{user?.full_name}</p>
        <p className="sidebar-footer-role">{user?.role}</p>
      </div>
    </aside>
  );
}