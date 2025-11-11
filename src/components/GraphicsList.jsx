import { useEffect, useRef, useState } from 'react';
import { generateId } from '../lib/id';
import { deleteCustomerGraphic, uploadCustomerGraphic } from '../lib/storage';

const PAGE_SIZE = 9;

export default function GraphicsList({ graphics = [], onChange, disabled, folderId }) {
  const [label, setLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [pending, setPending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [graphicToDelete, setGraphicToDelete] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

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
    if (!selectedFile) {
      setStatusMessage('לא נבחר קובץ להעלאה.');
      return;
    }
    if (!folderId) {
      setStatusMessage('לא נמצא מזהה לקוח מתאים.');
      return;
    }
    setStatusMessage(null);

    const newGraphic = {
      id: generateId(),
      label: label.trim() || 'קובץ ללא תיאור',
      uploadedAt: new Date().toISOString(),
    };
    setPending(true);
    try {
      const uploadResult = await uploadCustomerGraphic(folderId, selectedFile, {
        contentType: selectedFile.type,
        customMetadata: { label: newGraphic.label, id: newGraphic.id },
      });
      newGraphic.fileUrl = uploadResult.fileUrl;
      newGraphic.path = uploadResult.path;
      await onChange?.([...graphics, newGraphic]);
      setLabel('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setStatusMessage(error.message || 'אירעה שגיאה בהעלאת הקובץ.');
    } finally {
      setPending(false);
    }
  }

  async function removeGraphic(target) {
    if (!target) {
      return;
    }
    setPending(true);
    setStatusMessage(null);
    try {
      if (target.path) {
        await deleteCustomerGraphic(target.path);
      }
      const nextGraphics = graphics.filter((item) => item.id !== target.id);
      await onChange?.(nextGraphics);
      setGraphicToDelete(null);
    } catch (error) {
      setStatusMessage(error.message || 'אירעה שגיאה בעת מחיקת הקובץ.');
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
          placeholder="תיאור קובץ (לוגו, גרפיקה, PDF...)"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          disabled={isDisabled}
        />
        <label className="file-upload-wrapper btn btn-outline-secondary">
          בחרו קובץ
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,application/pdf"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            disabled={isDisabled}
          />
        </label>
        <button type="submit" disabled={isDisabled}>
          {pending ? 'מעלה...' : 'העלה'}
        </button>
      </form>
      {statusMessage && <p className="status-message error">{statusMessage}</p>}

      <div className="graphics-grid">
        {visibleGraphics.map((graphic) => (
          <div key={graphic.id} className="graphic-card">
            <div className="graphic-thumb">
              {graphic.fileUrl ? (
                <img src={graphic.fileUrl} alt={graphic.label} />
              ) : (
                <span>אין תצוגה מקדימה</span>
              )}
            </div>
            <div className="graphic-info">
              <strong>{graphic.label}</strong>
              <small>נוסף ב-{new Date(graphic.uploadedAt).toLocaleDateString()}</small>
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
              <button className="ghost" onClick={() => setGraphicToDelete(graphic)} disabled={isDisabled}>
                מחק
              </button>
            </div>
          </div>
        ))}

        {graphics.length === 0 && (
          <p className="empty-state">אין קבצים שמורים עבור לקוח זה.</p>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          className="ghost graphics-load-more"
          onClick={handleLoadMore}
          disabled={pending}
        >
          טען עוד
        </button>
      )}

      {graphicToDelete && (
        <div className="crm-modal-backdrop" onClick={() => setGraphicToDelete(null)}>
          <div className="crm-modal crm-modal-rtl" onClick={(event) => event.stopPropagation()}>
            <h3>מחיקת קובץ</h3>
            <p>אתם בטוחים שברצונכם למחוק את "{graphicToDelete.label}"?</p>
            <div className="form-actions">
              <button type="button" className="ghost" onClick={() => setGraphicToDelete(null)}>
                ביטול
              </button>
              <button type="button" onClick={() => removeGraphic(graphicToDelete)} disabled={pending}>
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
