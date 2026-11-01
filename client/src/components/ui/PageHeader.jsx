import '../../css/PageHeader.css';

export default function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <h2 className="page-header-title">{title}</h2>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}