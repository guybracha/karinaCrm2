import { useEffect, useState } from 'react';
import {
  fetchCustomerById,
  saveCustomerGraphics,
  updateCustomerNotes,
} from '../lib/customersApi';
import { fetchCustomerGraphicsFromStorage } from '../lib/storage';
import GraphicsList from './GraphicsList';

export default function CustomerDetails({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingGraphics, setUpdatingGraphics] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCustomer() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCustomerById(customerId);
        let storageGraphics = null;
        if (data) {
          const folderId = data.firebaseUid || data.id;
          storageGraphics = await fetchCustomerGraphicsFromStorage(folderId).catch(() => null);
        }
        if (isMounted) {
          const graphicsOverride =
            storageGraphics && storageGraphics.length > 0
              ? storageGraphics
              : data?.graphics;
          const nextCustomer = data ? { ...data, graphics: graphicsOverride } : null;
          setCustomer(nextCustomer);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'לא ניתן לטעון את פרטי הלקוח.');
          setCustomer(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    if (customerId) {
      loadCustomer();
    }
    return () => {
      isMounted = false;
    };
  }, [customerId]);

  async function handleGraphicsChange(nextGraphics) {
    if (!customer?.id) return;
    setUpdatingGraphics(true);
    setError(null);
    setCustomer((prev) => (prev ? { ...prev, graphics: nextGraphics } : prev));
    try {
      const updated = await saveCustomerGraphics(customer.id, nextGraphics);
      setCustomer(updated);
    } catch (err) {
      const message =
        err?.code === 'permission-denied'
          ? 'אין הרשאה לעדכן את נתוני הלקוח ב-Firestore. בדקו את חוקי האבטחה.'
          : err.message || 'שגיאה בשמירת רשימת הקבצים.';
      setError(message);
    } finally {
      setUpdatingGraphics(false);
    }
  }

  async function handleSaveNotes() {
    if (!customer?.id) return;
    setSavingNotes(true);
    setError(null);
    try {
      const updated = await updateCustomerNotes(customer.id, notesValue);
      setCustomer(updated);
      setEditingNotes(false);
    } catch (err) {
      setError(err.message || 'שגיאה בשמירת ההערות.');
    } finally {
      setSavingNotes(false);
    }
  }

  function startEditingNotes() {
    setNotesValue(customer?.notes || '');
    setEditingNotes(true);
  }

  function cancelEditingNotes() {
    setEditingNotes(false);
    setNotesValue('');
  }

  if (loading) {
    return <p className="status-message">טוען פרטי לקוח...</p>;
  }

  if (!customer) {
    return <p className="status-message">לא נמצאו פרטי לקוח.</p>;
  }

  return (
    <div className="customer-details">
      {error && <p className="status-message error">{error}</p>}
      <div className="customer-header">
        <h2>{customer.name}</h2>
        {customer.company && <p>חברה: {customer.company}</p>}
        {customer.phone && <p>טלפון: {customer.phone}</p>}
        {customer.email && <p>אימייל: {customer.email}</p>}
        {customer.city && <p>עיר: {customer.city}</p>}
      </div>

      <section>
        <div className="section-header">
          <h3>הערות</h3>
          {!editingNotes && (
            <button className="ghost" onClick={startEditingNotes} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
              ערוך
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="form">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="הוסיפו הערות חשובות, שינויים, ציפיות ועוד..."
              disabled={savingNotes}
              style={{ minHeight: '100px' }}
            />
            <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
              <button onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? 'שומר...' : 'שמור'}
              </button>
              <button className="ghost" onClick={cancelEditingNotes} disabled={savingNotes}>
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <div className={`notes-display ${!customer.notes ? 'empty' : ''}`}>
            {customer.notes || 'אין הערות'}
          </div>
        )}
      </section>

      <section>
        <h3>קבצים גרפיים ולוגואים</h3>
        <GraphicsList
          graphics={customer.graphics || []}
          onChange={handleGraphicsChange}
          disabled={updatingGraphics}
          folderId={customer.firebaseUid || customer.id}
        />
      </section>
    </div>
  );
}
