import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, UserPlus } from 'lucide-react';
import { customerService } from '../../services/customerService';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import useDebounce from '../../hooks/useDebounce';
import '../../css/CustomerPickerModal.css';

export default function CustomerPickerModal({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (term) => {
    setIsLoading(true);
    try {
      const res = await customerService.getAll({ search: term || undefined, limit: 20 });
      setCustomers(res.data);
    } catch {
      toast.error('Could not load customers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) search(debouncedQuery);
  }, [isOpen, debouncedQuery, search]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setIsCreating(false);
      setNewName('');
      setNewPhone('');
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Name is required.');
      return;
    }
    try {
      const res = await customerService.create({ name: newName, phone: newPhone || undefined });
      toast.success('Customer added.');
      onSelect(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create customer.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ជ្រើសរើសអតិថិជន" size="sm">
  {isCreating ? (
    <div className="cpm-create-form">
      <Input
        label="ឈ្មោះ"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="ឧ. សុខ ដារ៉ា"
        autoFocus
      />

      <Input
        label="លេខទូរស័ព្ទ (ជាជម្រើស)"
        value={newPhone}
        onChange={(e) => setNewPhone(e.target.value)}
        placeholder="012345678"
      />

      <div className="cpm-create-actions">
        <Button
          variant="outline"
          onClick={() => setIsCreating(false)}
        >
          ត្រឡប់ក្រោយ
        </Button>

        <Button onClick={handleCreate}>
          បន្ថែម និងជ្រើសរើស
        </Button>
      </div>
    </div>
  ) : (
    <>
      <div className="cpm-search-wrap">
        <Search size={15} className="cpm-search-icon" />

        <Input
          placeholder="ស្វែងរកអតិថិជន..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="cpm-search-input"
          autoFocus
        />
      </div>

      <div className="cpm-list">
        {isLoading && (
          <p className="cpm-list-message">
            កំពុងផ្ទុកទិន្នន័យ...
          </p>
        )}

        {!isLoading && customers.length === 0 && (
          <p className="cpm-list-message">
            មិនមានអតិថិជនទេ។
          </p>
        )}

        {customers.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className="cpm-customer-row"
          >
            <span className="cpm-customer-name">{c.name}</span>
            <span className="cpm-customer-phone">
              {c.phone || ''}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setIsCreating(true)}
        className="cpm-add-new-btn"
      >
        <UserPlus size={15} /> បន្ថែមអតិថិជនថ្មី
      </button>
    </>
  )}
</Modal>
  );
}