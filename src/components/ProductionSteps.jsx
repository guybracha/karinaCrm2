export default function ProductionSteps({ steps = [], onChange, disabled }) {
  function cycleStatus(status) {
    if (status === 'todo') return 'in-progress';
    if (status === 'in-progress') return 'done';
    return 'todo';
  }

  async function toggleStatus(id) {
    if (disabled) return;
    const updated = steps.map((step) => {
      if (step.id !== id) return step;
      return {
        ...step,
        status: cycleStatus(step.status),
        updatedAt: new Date().toISOString(),
      };
    });
    await onChange?.(updated);
  }

  return (
    <ul className="steps-list">
      {steps.map((step) => (
        <li key={step.id} className={`step step-${step.status}`}>
          <div>
            <strong>{step.title}</strong>
            <small>עודכן ב-{new Date(step.updatedAt).toLocaleDateString()}</small>
          </div>
          <button onClick={() => toggleStatus(step.id)} disabled={disabled}>
            {step.status === 'todo'
              ? 'להתחיל'
              : step.status === 'in-progress'
              ? 'להחזיר לטו-דו'
              : 'להתחיל שוב'}
          </button>
        </li>
      ))}
    </ul>
  );
}
