import { forwardRef } from 'react';
import '../../css/Input.css';

const Input = forwardRef(function Input(
  { label, error, hint, className = '', containerClassName = '', ...props },
  ref
) {
  return (
    <div className={containerClassName}>
      {label && <label className="input-label">{label}</label>}
      <input
        ref={ref}
        className={`input-field ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="input-error-text">{error}</p>}
      {hint && !error && <p className="input-hint-text">{hint}</p>}
    </div>
  );
});

export default Input;