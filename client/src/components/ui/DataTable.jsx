import { PageSpinner, EmptyState } from './Feedback';
import '../../css/DataTable.css';

/**
 * columns: [{ key, label, render?(row), className? }]
 * Generic table used across Products/Categories/Suppliers/Customers/etc.
 */
export default function DataTable({ columns, data, isLoading, emptyTitle, emptyDescription, emptyIcon, rowKey = 'id' }) {
  if (isLoading) return <PageSpinner />;
  if (!data || data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle || 'No records yet'} description={emptyDescription} />;
  }
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className || ''}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((col) => (
                <td key={col.key} className={col.className || ''}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}