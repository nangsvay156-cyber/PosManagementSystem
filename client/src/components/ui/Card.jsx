import '../../css/Card.css';

export default function Card({ children, className = '', padded = true, ...props }) {
  return (
    <div className={`card ${padded ? 'card-padded' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}