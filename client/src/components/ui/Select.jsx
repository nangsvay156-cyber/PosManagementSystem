import { forwardRef } from 'react';
import '../../css/Select.css';

const Select = forwardRef(function Select(
  { label, error, children, className = '', containerClassName = '', ...props },
  ref
) {
  return (
    <div className={containerClassName}>
      {label && <label className="select-label">{label}</label>}
      <select
        ref={ref}
        className={`select-field ${error ? 'select-error' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="select-error-text">{error}</p>}
    </div>
  );
});

export default Select;