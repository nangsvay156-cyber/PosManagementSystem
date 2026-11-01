import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Store, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import '../../css/Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { identifier: '', password: '' } });

  const onSubmit = async ({ identifier, password }) => {
    setIsSubmitting(true);
    try {
      await login(identifier, password);
      toast.success('Welcome back.');
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
 

  <h1 className="login-title">ប្រព័ន្ធគ្រប់គ្រងការលក់ (POS)</h1>

  <p className="login-subtitle">
    សូមស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងការលក់
  </p>
</div>
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="login-fields">
            <div className="login-field">
              <Input
                label="ឈ្មោះអ្នកប្រើប្រាស់ ឬអ៊ីមែល"
                placeholder="admin"
                autoComplete="username"
                autoFocus
                error={errors.identifier?.message}
                {...register('identifier', { required: 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ ឬអ៊ីមែល' })}
              />
              <User size={16} className="login-field-icon" />
            </div>
            <div className="login-field">
              <Input
                label="ពាក្យសម្ងាត់"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password', { required: 'សូមបញ្ចូលពាក្យសម្ងាត់' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="login-toggle-password"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Button type="submit" className="login-submit" loading={isSubmitting}>
            ចូលប្រព័ន្ធ
          </Button>
        </form>
        <p className="login-footer">
           © {new Date().getFullYear()} ប្រព័ន្ធគ្រប់គ្រងការលក់ (POS)។ រក្សាសិទ្ធិគ្រប់យ៉ាង។
        </p>
      </div>
    </div>
  );
}