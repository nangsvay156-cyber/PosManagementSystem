import '../../css/Feedback.css';

export function Spinner({ size = 24, className = '' }) {
  return (
    <div
      className={`spinner ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="page-spinner">
      <Spinner size={32} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={24} strokeWidth={1.75} />
        </div>
      )}
      <div>
        <p className="empty-state-title">{title}</p>
        {description && <p className="empty-state-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}