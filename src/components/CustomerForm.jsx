import { useState } from 'react';

export default function CustomerForm({ onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: '',
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    await onSubmit?.(form);
  }

  return (
    <form className="form" onSubmit={handleSave}>
      <label>
        שם לקוח
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          disabled={submitting}
        />
      </label>
      <label>
        חברה
        <input
          name="company"
          value={form.company}
          onChange={handleChange}
          disabled={submitting}
        />
      </label>
      <label>
        טלפון
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
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
          disabled={submitting}
        />
      </label>
      <label>
        הערות
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          disabled={submitting}
        />
      </label>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={submitting}>
          ביטול
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </form>
  );
}
