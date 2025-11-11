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
