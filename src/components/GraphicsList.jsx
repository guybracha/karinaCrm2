import { useEffect, useRef, useState } from 'react';
import { generateId } from '../lib/id';
import { deleteCustomerGraphic, uploadCustomerGraphic } from '../lib/storage';

const PAGE_SIZE = 9;

export default function GraphicsList({ graphics = [], onChange, disabled, folderId }) {
  const [label, setLabel] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pending, setPending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [graphicToDelete, setGraphicToDelete] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all'); // 'all', 'images', 'pdfs'
  const [uploadProgress, setUploadProgress] = useState(null);
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
    if (!selectedFiles || selectedFiles.length === 0) {
      setStatusMessage('לא נבחרו קבצים להעלאה.');
      return;
    }
    if (!folderId) {
      setStatusMessage('לא נמצא מזהה לקוח מתאים.');
      return;
    }
    setStatusMessage(null);

    setPending(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });
    const newGraphics = [];
    const errors = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const newGraphic = {
          id: generateId(),
          label: selectedFiles.length === 1 && label.trim() 
            ? label.trim() 
            : (label.trim() ? `${label.trim()} - ${file.name}` : file.name),
          uploadedAt: new Date().toISOString(),
        };

        try {
          setUploadProgress({ current: i + 1, total: selectedFiles.length });
          const uploadResult = await uploadCustomerGraphic(folderId, file, {
            contentType: file.type,
            customMetadata: { label: newGraphic.label, id: newGraphic.id },
          });
          newGraphic.fileUrl = uploadResult.fileUrl;
          newGraphic.path = uploadResult.path;
          newGraphics.push(newGraphic);
        } catch (error) {
          errors.push(`${file.name}: ${error.message}`);
        }
      }

      if (newGraphics.length > 0) {
        await onChange?.([...graphics, ...newGraphics]);
        setLabel('');
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

      if (errors.length > 0) {
        setStatusMessage(`הועלו ${newGraphics.length} קבצים בהצלחה. שגיאות: ${errors.join(', ')}`);
      } else if (newGraphics.length > 0) {
        setStatusMessage(`הועלו ${newGraphics.length} קבצים בהצלחה!`);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage('כל הקבצים נכשלו בהעלאה.');
      }
    } catch (error) {
      setStatusMessage(error.message || 'אירעה שגיאה בהעלאת הקבצים.');
    } finally {
      setPending(false);
      setUploadProgress(null);
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

  // סינון תמונות לפי חיפוש וסוג קובץ
  const filteredGraphics = graphics.filter((graphic) => {
    const isPdf = graphic.path?.toLowerCase().endsWith('.pdf') || 
                  graphic.fileUrl?.toLowerCase().endsWith('.pdf') ||
                  graphic.label?.toLowerCase().includes('pdf');
    
    // סינון לפי סוג קובץ
    if (fileTypeFilter === 'images' && isPdf) return false;
    if (fileTypeFilter === 'pdfs' && !isPdf) return false;
    
    // סינון לפי חיפוש
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const labelMatch = graphic.label?.toLowerCase().includes(query);
      const pathMatch = graphic.path?.toLowerCase().includes(query);
      return labelMatch || pathMatch;
    }
    
    return true;
  });

  const isDisabled = disabled || pending;
  const visibleGraphics = filteredGraphics.slice(0, visibleCount);
  const hasMore = filteredGraphics.length > visibleCount;

  return (
    <div className="graphics-section">
      <form className="form-inline" onSubmit={addGraphic}>
        <input
          placeholder="תיאור קבצים (אופציונלי)"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          disabled={isDisabled}
        />
        <label className="file-upload-wrapper btn btn-outline-secondary">
          {selectedFiles.length > 0 ? `נבחרו ${selectedFiles.length} קבצים` : 'בחרו קבצים'}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,application/pdf"
            multiple
            onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            disabled={isDisabled}
          />
        </label>
        <button type="submit" disabled={isDisabled}>
          {pending ? `מעלה... (${uploadProgress?.current || 0}/${uploadProgress?.total || 0})` : 'העלה'}
        </button>
      </form>
      
      {/* תצוגה מקדימה של הקבצים */}
      {selectedFiles.length > 0 && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          border: '2px dashed var(--accent)', 
          borderRadius: '8px',
          backgroundColor: 'var(--bg)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong>תצוגה מקדימה ({selectedFiles.length} קבצים):</strong>
            <button 
              type="button"
              className="ghost"
              onClick={() => {
                setSelectedFiles([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
            >
              ביטול הכל
            </button>
          </div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '0.5rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {selectedFiles.map((file, index) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <div key={index} style={{
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  position: 'relative'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      const newFiles = selectedFiles.filter((_, i) => i !== index);
                      setSelectedFiles(newFiles);
                      if (newFiles.length === 0 && fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '0.25rem',
                      left: '0.25rem',
                      background: 'rgba(255,0,0,0.8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}
                    title="הסר קובץ"
                  >
                    ×
                  </button>
                  <div style={{ 
                    height: '100px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    marginBottom: '0.25rem'
                  }}>
                    {file.type.startsWith('image/') ? (
                      <img 
                        src={previewUrl} 
                        alt={file.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                      />
                    ) : file.type === 'application/pdf' ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem' }}>📄</div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem' }}>📎</div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--subtext)', wordBreak: 'break-word', textAlign: 'center' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--subtext)', textAlign: 'center', marginTop: '0.2rem' }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {statusMessage && (
        <p className={`status-message ${statusMessage.includes('בהצלחה') ? 'success' : 'error'}`}>
          {statusMessage}
        </p>
      )}

      {/* חיפוש וסינון */}
      <div className="graphics-filters" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="חיפוש לפי שם תמונה..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
        />
        <select 
          value={fileTypeFilter} 
          onChange={(e) => setFileTypeFilter(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', minWidth: '150px' }}
        >
          <option value="all">כל הקבצים</option>
          <option value="images">תמונות בלבד</option>
          <option value="pdfs">PDFs בלבד</option>
        </select>
      </div>

      {searchQuery && (
        <p style={{ color: 'var(--subtext)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          נמצאו {filteredGraphics.length} מתוך {graphics.length} קבצים
        </p>
      )}

      <div className="graphics-grid">
        {visibleGraphics.map((graphic) => {
          const isPdf = graphic.path?.toLowerCase().endsWith('.pdf') || 
                        graphic.fileUrl?.toLowerCase().endsWith('.pdf') ||
                        graphic.label?.toLowerCase().includes('pdf');
          
          // בדיקה אם יש URL תקין
          const hasValidUrl = graphic.fileUrl && graphic.fileUrl.startsWith('http');
          
          return (
            <div key={graphic.id} className="graphic-card">
              <div className="graphic-thumb">
                {hasValidUrl ? (
                  isPdf ? (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#fff3cd',
                      gap: '0.5rem'
                    }}>
                      <div style={{ fontSize: '4rem' }}>📄</div>
                      <div style={{ fontSize: '0.8rem', color: '#856404', textAlign: 'center', padding: '0 0.5rem' }}>
                        קובץ PDF
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={graphic.fileUrl} 
                      alt={graphic.label}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--subtext);"><div style="font-size:2rem">🖼️</div><div style="font-size:0.8rem;margin-top:0.5rem">תמונה לא זמינה</div></div>';
                      }}
                    />
                  )
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    gap: '0.5rem'
                  }}>
                    <div style={{ fontSize: '2rem' }}>⚠️</div>
                    <div style={{ fontSize: '0.8rem', textAlign: 'center', padding: '0 0.5rem' }}>
                      קובץ לא זמין
                    </div>
                  </div>
                )}
              </div>
              <div className="graphic-info">
                <strong>{graphic.label}</strong>
                <small>נוסף ב-{new Date(graphic.uploadedAt).toLocaleDateString()}</small>
              </div>
              <div className="graphic-actions">
                {hasValidUrl && (
                  <>
                    {isPdf ? (
                      <>
                        <a
                          className="ghost"
                          href={graphic.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.85rem' }}
                        >
                          👁️ צפה
                        </a>
                        <a
                          className="ghost"
                          href={graphic.fileUrl}
                          download={graphic.label || 'file.pdf'}
                          style={{ fontSize: '0.85rem' }}
                        >
                          ⬇️ הורד
                        </a>
                      </>
                    ) : (
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
                  </>
                )}
                {!hasValidUrl && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--subtext)' }}>
                    קובץ פגום
                  </span>
                )}
                <button className="ghost" onClick={() => setGraphicToDelete(graphic)} disabled={isDisabled}>
                  מחק
                </button>
              </div>
            </div>
          );
        })}

        {graphics.length === 0 && (
          <p className="empty-state">אין קבצים שמורים עבור לקוח זה.</p>
        )}
        
        {graphics.length > 0 && filteredGraphics.length === 0 && (
          <p className="empty-state">לא נמצאו קבצים התואמים לחיפוש</p>
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
