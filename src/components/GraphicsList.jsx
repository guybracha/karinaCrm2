import { useEffect, useState } from 'react';
import { generateId } from '../lib/id';

const PAGE_SIZE = 9;

export default function GraphicsList({ graphics = [], onChange, disabled }) {
  const [label, setLabel] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [graphicToDelete, setGraphicToDelete] = useState(null);

  useEffect(() => {
    if (!graphics.length) {
      setVisibleCount(PAGE_SIZE);
      return;
    }
    setVisibleCount((prev) => {
      if (prev <= PAGE_SIZE) {
        return Math.min(PAGE_SIZE, graphics.length);
      }
      return Math.min(prev, graphics.length);
    });
  }, [graphics]);

  async function addGraphic(event) {
    event.preventDefault();
    if (!fileUrl.trim()) {
      return;
    }
    const newGraphic = {
      id: generateId(),
      label: label.trim() || 'קובץ ללא תיאור',
      fileUrl: fileUrl.trim(),
      uploadedAt: new Date().toISOString(),
    };
    setPending(true);
    try {
      await onChange?.([...graphics, newGraphic]);
      setLabel('');
      setFileUrl('');
    } finally {
      setPending(false);
    }
  }

  async function removeGraphic(id) {
    setPending(true);
    try {
      await onChange?.(graphics.filter((item) => item.id !== id));
      setGraphicToDelete(null);
    } finally {
      setPending(false);
    }
  }

  function handleLoadMore() {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, graphics.length));
  }

  const isDisabled = disabled || pending;
  const visibleGraphics = graphics.slice(0, visibleCount);
  const hasMore = graphics.length > visibleCount;

  return (
    <div className="graphics-section">
      <form className="form-inline" onSubmit={addGraphic}>
        <input
          placeholder="תיאור קובץ (לוגו, גב, חזית...)"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          disabled={isDisabled}
        />
        <input
          placeholder="קישור לתמונה / קובץ"
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          disabled={isDisabled}
        />
        <button type="submit" disabled={isDisabled}>
          {pending ? 'שומר...' : 'הוסף'}
        </button>
      </form>

      <div className="graphics-grid">
        {visibleGraphics.map((graphic) => (
          <div key={graphic.id} className="graphic-card">
            <div className="graphic-thumb">
              {graphic.fileUrl ? (
                <img src={graphic.fileUrl} alt={graphic.label} />
              ) : (
                <span>אין תצוגה זמינה</span>
              )}
            </div>
            <div className="graphic-info">
              <strong>{graphic.label}</strong>
              <small>נוסף ב־{new Date(graphic.uploadedAt).toLocaleDateString()}</small>
            </div>
            <div className="graphic-actions">
              {graphic.fileUrl && (
                <a
                  className="ghost download-button"
                  href={graphic.fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  הורדה
                </a>
              )}
              <button
                className="ghost"
                onClick={() => setGraphicToDelete(graphic)}
                disabled={isDisabled}
              >
                מחק
              </button>
            </div>
          </div>
        ))}

        {graphics.length === 0 && (
          <p className="empty-state">אין עדיין קבצי גרפיקה ללקוח הזה.</p>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          className="ghost graphics-load-more"
          onClick={handleLoadMore}
          disabled={pending}
        >
          הצג עוד
        </button>
      )}

      {graphicToDelete && (
        <div className="modal-backdrop" onClick={() => setGraphicToDelete(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>מחיקת קובץ</h3>
            <p>האם אתה בטוח שברצונך למחוק את "{graphicToDelete.label}"?</p>
            <div className="form-actions">
              <button type="button" className="ghost" onClick={() => setGraphicToDelete(null)}>
                ביטול
              </button>
              <button
                type="button"
                onClick={() => removeGraphic(graphicToDelete.id)}
                disabled={pending}
              >
                מחיקה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
