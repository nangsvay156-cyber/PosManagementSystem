import { useEffect, useState } from 'react';
import { LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import '../../css/Topbar.css';

export default function Topbar({ title }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/login');
  };

  return (
    <header className="topbar">
      <h1 className="topbar-title">ប្រព័ន្ធគ្រប់គ្រងការលក់</h1>
      <div className="topbar-actions">
        <p className="topbar-clock">
          {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          {'  '}
          {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </p>
        <button className="topbar-icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button onClick={handleLogout} className="topbar-signout-btn">
          <LogOut size={16} />
          ចាកចេញពីប្រព័ន្ធ
        </button>
      </div>
    </header>
  );
}