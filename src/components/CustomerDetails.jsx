import { useEffect, useState } from 'react';
import {
  fetchCustomerById,
  saveCustomerGraphics,
  updateCustomerNotes,
  updateCustomerTasks,
  deleteCustomer,
} from '../lib/customersApi';
import GraphicsList from './GraphicsList';
import TaskBoard from './TaskBoard';

export default function CustomerDetails({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingGraphics, setUpdatingGraphics] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingTasks, setSavingTasks] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCustomer() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCustomerById(customerId);
        if (isMounted) {
          setCustomer(data);
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

  async function handleTasksChange(newTasks) {
    if (!customer?.id) return;
    setSavingTasks(true);
    setError(null);
    setCustomer((prev) => (prev ? { ...prev, tasks: newTasks } : prev));
    try {
      const updated = await updateCustomerTasks(customer.id, newTasks);
      setCustomer(updated);
    } catch (err) {
      setError(err.message || 'שגיאה בשמירת המשימות.');
    } finally {
      setSavingTasks(false);
    }
  }

  async function handleDeleteCustomer() {
    if (!customer?.id) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCustomer(customer.id);
      setShowDeleteModal(false);
      // רענון הדף או חזרה לרשימת הלקוחות
      window.location.reload();
    } catch (err) {
      const message = err?.code === 'permission-denied'
        ? 'אין הרשאה למחוק לקוחות. בדוק את הגדרות Firebase Security Rules.'
        : err.message || 'שגיאה במחיקת הלקוח.';
      setError(message);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
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
        <div>
          <h2>{customer.name}</h2>
          {customer.company && <p>חברה: {customer.company}</p>}
          {customer.phone && <p>טלפון: {customer.phone}</p>}
          {customer.email && <p>אימייל: {customer.email}</p>}
          {customer.city && <p>עיר: {customer.city}</p>}
        </div>
        <button 
          className="ghost" 
          onClick={() => setShowDeleteModal(true)}
          disabled={deleting}
          style={{ 
            color: '#dc3545', 
            border: '1px solid #dc3545',
            alignSelf: 'flex-start'
          }}
        >
          🗑️ מחק לקוח
        </button>
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

      <section>
        <h3>משימות</h3>
        <TaskBoard
          tasks={customer.tasks || []}
          onChange={handleTasksChange}
          disabled={savingTasks}
        />
      </section>

      {/* מודל אישור מחיקה */}
      {showDeleteModal && (
        <div className="crm-modal-backdrop" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div
            className="crm-modal crm-modal-rtl"
            role="dialog"
            aria-modal="true"
            aria-label="אישור מחיקת לקוח"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="crm-modal-header">
              <div>
                <h3>❗ אישור מחיקה</h3>
                <p className="crm-modal-subtitle">
                  האם אתה בטוח שברצונך למחוק את הלקוח <strong>{customer.name}</strong>?
                </p>
                <p className="crm-modal-subtitle" style={{ color: '#dc3545', marginTop: '0.5rem' }}>
                  פעולה זו תמחק את כל ההזמנות והקבצים של הלקוח ולא ניתן לבטל אותה!
                </p>
              </div>
              <button
                type="button"
                className="crm-modal-close"
                onClick={() => setShowDeleteModal(false)}
                aria-label="סגור"
                disabled={deleting}
              >
                ×
              </button>
            </div>

            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                לא, ביטול
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={deleting}
                style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
              >
                {deleting ? 'מוחק...' : 'כן, מחק לקוח'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
