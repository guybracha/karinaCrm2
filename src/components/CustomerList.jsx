import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createCustomer, fetchCustomers, subscribeToCustomers } from '../lib/customersApi';
import NewCustomerModal from './NewCustomerModal';

const isTestEnv = process.env.NODE_ENV === 'test';

export default function CustomerList({ onSelect, selectedId }) {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedRef = useRef(selectedId);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCustomers();
      setCustomers(list);
      if (!selectedRef.current && list.length > 0) {
        onSelect?.(list[0].id);
      }
    } catch (err) {
      setError(err.message || 'אירעה שגיאה בעת טעינת רשימת הלקוחות.');
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  useEffect(() => {
    if (isTestEnv) {
      setLoading(false);
      return;
    }
    load();
  }, [load]);

  useEffect(() => {
    if (isTestEnv) {
      return undefined;
    }
    const unsubscribe = subscribeToCustomers(
      (list) => {
        setCustomers(list);
        if (!selectedRef.current && list.length > 0) {
          onSelect?.(list[0].id);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to subscribe to customer updates.');
      },
    );
    return unsubscribe;
  }, [onSelect]);

  async function handleCreate(formData) {
    setSubmitting(true);
    setError(null);
    try {
      const customer = await createCustomer(formData);
      await load();
      setModalOpen(false);
      onSelect?.(customer?.id);
    } catch (err) {
      setError(err.message || 'אירעה שגיאה בעת שמירת הלקוח החדש.');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) {
      return customers;
    }
    return customers.filter((customer) =>
      `${customer.name} ${customer.company} ${customer.phone}`.toLowerCase().includes(text),
    );
  }, [customers, search]);

  return (
    <div className="customer-panel">
      <div className="panel-header">
        <h2>לקוחות</h2>
        <button type="button" onClick={() => setModalOpen(true)}>
          + לקוח חדש
        </button>
      </div>

      <input
        className="search-input"
        placeholder="חיפוש לפי שם / חברה / טלפון"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        dir="rtl"
      />

      {error && (
        <p className="status-message error" dir="rtl">
          {error}
        </p>
      )}
      {loading ? (
        <p className="status-message">טוען לקוחות...</p>
      ) : (
        <ul className="customer-list" dir="rtl">
          {filtered.map((customer) => (
            <li
              key={customer.id}
              className={customer.id === selectedId ? 'selected' : undefined}
              onClick={() => onSelect?.(customer.id)}
            >
              <strong>{customer.name}</strong>
              {customer.company && <span> · {customer.company}</span>}
              {customer.phone && <div className="sub-text">{customer.phone}</div>}
            </li>
          ))}
          {filtered.length === 0 && !error && (
            <li className="empty-state">לא נמצאו לקוחות מתאימים.</li>
          )}
        </ul>
      )}

      <NewCustomerModal
        open={isModalOpen}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
