import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createCustomer, fetchCustomers, subscribeToCustomers } from '../lib/customersApi';
import { uploadCustomerGraphic } from '../lib/storage';
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

  async function handleCreate(formData, files = []) {
    setSubmitting(true);
    setError(null);
    try {
      // יצירת הלקוח תחילה
      const customer = await createCustomer(formData);
      
      // העלאת קבצים אם נבחרו
      if (customer?.id && files.length > 0) {
        console.log(`Uploading ${files.length} files for customer ${customer.id}...`);
        
        const uploadPromises = files.map((file) =>
          uploadCustomerGraphic(customer.firebaseUid || customer.id, file, {
            customMetadata: {
              label: file.name,
              uploadedBy: 'customer-creation',
            },
          }).catch((err) => {
            console.error(`Failed to upload ${file.name}:`, err);
            return null;
          })
        );
        
        const results = await Promise.all(uploadPromises);
        const successCount = results.filter(Boolean).length;
        console.log(`Successfully uploaded ${successCount} out of ${files.length} files`);
        
        if (successCount < files.length) {
          alert(`${successCount} מתוך ${files.length} קבצים הועלו בהצלחה`);
        }
      }
      
      setModalOpen(false);
      
      // רענון מיידי של רשימת הלקוחות
      await load();
      
      // בחירת הלקוח החדש
      if (customer?.id) {
        onSelect?.(customer.id);
      }
    } catch (err) {
      console.error('שגיאה ביצירת לקוח:', err);
      console.error('קוד שגיאה:', err.code);
      console.error('הודעת שגיאה:', err.message);
      const errorMessage = err.code === 'permission-denied' 
        ? 'אין לך הרשאה ליצור לקוחות חדשים. בדוק את הגדרות Firebase Security Rules.'
        : err.code === 'unauthenticated'
        ? 'עליך להיות מחובר כדי ליצור לקוח חדש.'
        : err.message || 'אירעה שגיאה בעת שמירת הלקוח החדש.';
      setError(errorMessage);
      alert(`שגיאה: ${errorMessage}\n\nפרטים טכניים: ${err.code || 'לא ידוע'}`);
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
