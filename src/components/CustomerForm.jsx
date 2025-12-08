import { useState } from 'react';

export default function CustomerForm({
  onSubmit,
  onCancel,
  submitting,
  cities = [],
  citiesLoading = false,
  citiesError = null,
}) {
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    city: '',
    notes: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  }

  function removeFile(index) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    await onSubmit?.(form, selectedFiles);
  }

  return (
    <form className="form customer-form" onSubmit={handleSave} dir="rtl" lang="he">
      <div className="customer-form-grid">
        <label>
          שם מלא
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="קרינה כהן"
            required
            disabled={submitting}
          />
        </label>
        <label>
          שם חברה
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Karina Studio"
            disabled={submitting}
          />
        </label>
        <label>
          עיר
          <select
            name="city"
            value={form.city}
            onChange={handleChange}
            disabled={submitting || citiesLoading || cities.length === 0}
          >
            <option value="">בחרו עיר...</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {citiesLoading && <small className="field-hint">טוען רשימת ערים...</small>}
          {citiesError && <small className="field-hint error">{citiesError}</small>}
        </label>
        <label>
          טלפון
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="050-000-0000"
            disabled={submitting}
          />
        </label>
        <label>
          אימייל
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="hello@karina.co.il"
            disabled={submitting}
          />
        </label>
      </div>
      <label>
        הערות
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="פרטים חשובים, ציפיות, זמני אספקה ועוד."
          disabled={submitting}
        />
      </label>

      <div style={{ marginTop: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          קבצים ומסמכים
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.ai,.psd"
            onChange={handleFileChange}
            disabled={submitting}
            id="file-upload-input"
            style={{ 
              position: 'absolute',
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 1
            }}
          />
          <label
            htmlFor="file-upload-input"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              border: 'none',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              opacity: submitting ? 0.6 : 1,
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
            }}
          >
            <span style={{ fontSize: '20px' }}>📁</span>
            <span>בחר קבצים להעלאה</span>
            {selectedFiles.length > 0 && (
              <span style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '2px 8px', 
                borderRadius: '12px',
                fontSize: '13px'
              }}>
                {selectedFiles.length}
              </span>
            )}
          </label>
        </div>
        <small className="field-hint" style={{ display: 'block', marginTop: '6px', color: '#666' }}>
          📎 ניתן להעלות תמונות, PDF, מסמכים וקבצי עיצוב
        </small>
      </div>

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <strong style={{ fontSize: '14px', color: '#333' }}>
            קבצים נבחרים ({selectedFiles.length}):
          </strong>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {selectedFiles.map((file, index) => (
              <li key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                borderRadius: '8px',
                fontSize: '14px',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #e0e7ff 0%, #b8c5e8 100%)';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📄</span>
                  <span style={{ fontWeight: '500' }}>{file.name}</span>
                  <span style={{ 
                    color: '#666', 
                    fontSize: '12px',
                    background: 'rgba(255,255,255,0.7)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={submitting}
                  style={{
                    background: '#ff4757',
                    border: 'none',
                    color: 'white',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    opacity: submitting ? 0.5 : 1
                  }}
                  title="הסר קובץ"
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background = '#ee5a6f';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ff4757';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="form-actions">
        <button type="button" className="ghost" onClick={onCancel} disabled={submitting}>
          ביטול
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'שומרים…' : 'שמור לקוח'}
        </button>
      </section>
    </form>
  );
}
