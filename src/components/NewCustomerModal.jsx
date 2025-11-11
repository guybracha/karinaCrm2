import { useEffect } from 'react';
import { useCities } from '../lib/useCities';
import CustomerForm from './CustomerForm';

export default function NewCustomerModal({ open, onClose, onSubmit, submitting }) {
  const {
    cities,
    loading: citiesLoading,
    error: citiesError,
  } = useCities();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function handleBackdropClick() {
    if (!submitting) {
      onClose?.();
    }
  }

  return (
    <div className="crm-modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="crm-modal crm-modal-rtl"
        role="dialog"
        aria-modal="true"
        aria-label="צור לקוח חדש"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="crm-modal-header">
          <div>
            <p className="crm-modal-eyebrow">צור לקוח חדש</p>
            <h3>פתיחת לקוח חדש במערכת</h3>
            <p className="crm-modal-subtitle">
              מלאו את הפרטים הראשוניים של הלקוח. ניתן להשלים או לערוך אותם לאחר מכן.
            </p>
          </div>
          <button
            type="button"
            className="crm-modal-close"
            onClick={onClose}
            aria-label="סגור חלון יצירת לקוח"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <CustomerForm
          submitting={submitting}
          onCancel={onClose}
          onSubmit={onSubmit}
          cities={cities}
          citiesLoading={citiesLoading}
          citiesError={citiesError}
        />
      </div>
    </div>
  );
}
