import React from 'react';

export default function OrdersList({ orders = [] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="empty-state" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        אין הזמנות עדיין
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'לא ידוע';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: 'טיוטה',
      pending: 'ממתין',
      processing: 'בתהליך',
      completed: 'הושלם',
      cancelled: 'בוטל',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      draft: '#6c757d',
      pending: '#ffc107',
      processing: '#17a2b8',
      completed: '#28a745',
      cancelled: '#dc3545',
    };
    return colorMap[status] || '#6c757d';
  };

  return (
    <div className="orders-list">
      <style>{`
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .order-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
          background: #fff;
          transition: box-shadow 0.2s;
        }

        .order-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #eee;
        }

        .order-id {
          font-family: monospace;
          font-size: 0.85rem;
          color: #666;
        }

        .order-status {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          color: white;
        }

        .order-details {
          display: grid;
          gap: 0.5rem;
        }

        .order-detail-row {
          display: flex;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .order-detail-label {
          font-weight: 600;
          color: #555;
          min-width: 100px;
        }

        .order-detail-value {
          color: #333;
        }

        .order-items {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .order-items-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .order-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .order-item {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
          border-right: 3px solid #007bff;
        }

        .order-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #dee2e6;
        }

        .order-item-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: #212529;
        }

        .order-item-price {
          font-weight: 600;
          color: #28a745;
          font-size: 1rem;
        }

        .order-item-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .item-detail-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }

        .item-detail-label {
          font-weight: 500;
          color: #6c757d;
          min-width: 60px;
        }

        .item-detail-value {
          color: #495057;
        }

        .color-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 12px;
          font-size: 0.85rem;
        }

        .color-preview {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #dee2e6;
        }

        .sizes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .size-badge {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0.6rem;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .size-label {
          font-weight: 600;
          color: #495057;
        }

        .size-qty {
          color: #007bff;
          font-weight: 600;
        }

        .order-notes {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: #fff9e6;
          border-right: 3px solid #ffc107;
          border-radius: 4px;
          font-size: 0.9rem;
          color: #333;
        }

        .order-logos {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .order-logos-title {
          font-weight: 600;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          color: #333;
        }

        .logos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .logo-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          transition: all 0.2s;
        }

        .logo-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .logo-preview {
          width: 100%;
          aspect-ratio: 1;
          object-fit: contain;
          background: white;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }

        .logo-label {
          font-size: 0.75rem;
          color: #666;
          text-align: center;
          word-break: break-word;
          max-width: 100%;
        }

        .logo-link {
          font-size: 0.75rem;
          color: #007bff;
          text-decoration: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .logo-link:hover {
          background: #e7f3ff;
          text-decoration: underline;
        }

        .mockups-section {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #f1f3f5;
          border-radius: 6px;
        }

        .mockups-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          color: #495057;
        }
      `}</style>

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <span className="order-id">הזמנה #{order.id.slice(-8)}</span>
            <span
              className="order-status"
              style={{ backgroundColor: getStatusColor(order.status) }}
            >
              {getStatusLabel(order.status)}
            </span>
          </div>

          <div className="order-details">
            {/* הצגת סכום כולל אם קיים */}
            {order.totals && order.totals.grandTotal !== undefined && (
              <div className="order-detail-row" style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                color: '#28a745',
                padding: '0.5rem',
                background: '#f8f9fa',
                borderRadius: '4px',
                marginBottom: '0.75rem'
              }}>
                <span className="order-detail-label">סה"כ לתשלום:</span>
                <span className="order-detail-value">₪{order.totals.grandTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="order-detail-row">
              <span className="order-detail-label">תאריך יצירה:</span>
              <span className="order-detail-value">{formatDate(order.createdAt)}</span>
            </div>
            <div className="order-detail-row">
              <span className="order-detail-label">עדכון אחרון:</span>
              <span className="order-detail-value">{formatDate(order.updatedAt)}</span>
            </div>
            {order.customer && (
              <>
                {order.customer.displayName && (
                  <div className="order-detail-row">
                    <span className="order-detail-label">שם:</span>
                    <span className="order-detail-value">{order.customer.displayName}</span>
                  </div>
                )}
                {order.customer.phoneNumber && (
                  <div className="order-detail-row">
                    <span className="order-detail-label">טלפון:</span>
                    <span className="order-detail-value">{order.customer.phoneNumber}</span>
                  </div>
                )}
                {order.customer.email && (
                  <div className="order-detail-row">
                    <span className="order-detail-label">אימייל:</span>
                    <span className="order-detail-value">{order.customer.email}</span>
                  </div>
                )}
              </>
            )}
            {/* פרטי משלוח */}
            {order.shipping && (
              <>
                {order.shipping.label && (
                  <div className="order-detail-row">
                    <span className="order-detail-label">סוג משלוח:</span>
                    <span className="order-detail-value">
                      {order.shipping.label}
                      {order.shipping.cost !== undefined && ` (₪${order.shipping.cost})`}
                    </span>
                  </div>
                )}
                {order.shipping.address?.address && (
                  <div className="order-detail-row">
                    <span className="order-detail-label">כתובת משלוח:</span>
                    <span className="order-detail-value">{order.shipping.address.address}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {order.items && order.items.length > 0 && (
            <div className="order-items">
              <div className="order-items-title">פריטים בהזמנה:</div>
              <div className="order-items-list">
                {order.items.map((item, idx) => {
                  // חישוב כמות - תמיכה בפורמטים שונים
                  let totalQty = 0;
                  if (item.lineTotal !== undefined && item.unitAfter) {
                    // אם יש lineTotal ו-unitAfter, נחשב מהם
                    totalQty = item.qty || 0;
                  } else if (item.variants?.sizeTotals) {
                    // חישוב מ-variants.sizeTotals
                    totalQty = Object.values(item.variants.sizeTotals).reduce((sum, qty) => sum + (qty || 0), 0);
                  } else if (item.sizeSplit && Array.isArray(item.sizeSplit)) {
                    // חישוב מ-sizeSplit
                    totalQty = item.sizeSplit.reduce((sum, split) => sum + (split.qty || 0), 0);
                  } else if (item.sizes) {
                    // פורמט ישן - sizes object
                    totalQty = Object.values(item.sizes).reduce((sum, qty) => sum + (qty || 0), 0);
                  } else {
                    totalQty = item.qty || 0;
                  }
                  
                  // חישוב מחיר - תמיכה בפורמטים שונים
                  const unitPrice = item.unitAfter || item.price || item.unitPrice || item.baseUnit || 0;
                  const totalPrice = item.lineTotal || (unitPrice * totalQty);
                  
                  return (
                    <div key={idx} className="order-item">
                      <div className="order-item-header">
                        <span className="order-item-name">
                          {item.productName || item.productId || 'מוצר ללא שם'}
                        </span>
                        <span className="order-item-price">₪{totalPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="order-item-details">
                        {item.productId && (
                          <div className="item-detail-row">
                            <span className="item-detail-label">קוד:</span>
                            <span className="item-detail-value">{item.productId}</span>
                          </div>
                        )}
                        
                        {/* תצוגת מחיר יחידה */}
                        {unitPrice > 0 && (
                          <div className="item-detail-row">
                            <span className="item-detail-label">מחיר יחידה:</span>
                            <span className="item-detail-value">₪{unitPrice.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {/* תצוגת מידות וצבעים - תמיכה בפורמטים שונים */}
                        {item.sizeSplit && Array.isArray(item.sizeSplit) && item.sizeSplit.length > 0 ? (
                          <div>
                            <div className="item-detail-label" style={{ marginBottom: '0.5rem' }}>
                              כמויות לפי מידות וצבעים:
                            </div>
                            <div className="sizes-grid">
                              {item.sizeSplit.map((split, splitIdx) => (
                                <div key={splitIdx} className="size-badge" style={{ 
                                  flexDirection: 'column', 
                                  alignItems: 'start',
                                  minWidth: '120px'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span className="size-label">{split.size}</span>
                                    <span className="size-qty">×{split.qty}</span>
                                  </div>
                                  {split.color && (
                                    <div style={{ 
                                      fontSize: '0.75rem', 
                                      color: '#6c757d',
                                      marginTop: '0.25rem',
                                      width: '100%'
                                    }}>
                                      {split.color}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="item-detail-row" style={{ marginTop: '0.5rem' }}>
                              <span className="item-detail-label">סה"כ:</span>
                              <span className="item-detail-value" style={{ fontWeight: 600 }}>
                                {totalQty} יחידות
                              </span>
                            </div>
                          </div>
                        ) : item.variants?.byColorSize && Object.keys(item.variants.byColorSize).length > 0 ? (
                          <div>
                            <div className="item-detail-label" style={{ marginBottom: '0.5rem' }}>
                              כמויות לפי צבע ומידה:
                            </div>
                            {Object.entries(item.variants.byColorSize).map(([color, sizes]) => (
                              <div key={color} style={{ marginBottom: '0.75rem' }}>
                                <div style={{ 
                                  fontSize: '0.85rem', 
                                  fontWeight: 600, 
                                  color: '#495057',
                                  marginBottom: '0.25rem'
                                }}>
                                  {color}
                                </div>
                                <div className="sizes-grid">
                                  {Object.entries(sizes)
                                    .filter(([_, qty]) => qty > 0)
                                    .map(([size, qty]) => (
                                      <div key={size} className="size-badge">
                                        <span className="size-label">{size}</span>
                                        <span className="size-qty">×{qty}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                            <div className="item-detail-row" style={{ marginTop: '0.5rem' }}>
                              <span className="item-detail-label">סה"כ:</span>
                              <span className="item-detail-value" style={{ fontWeight: 600 }}>
                                {totalQty} יחידות
                              </span>
                            </div>
                          </div>
                        ) : item.sizes && Object.keys(item.sizes).length > 0 ? (
                          <div>
                            <div className="item-detail-label" style={{ marginBottom: '0.5rem' }}>
                              כמויות לפי מידות:
                            </div>
                            {item.color && (
                              <div className="item-detail-row" style={{ marginBottom: '0.5rem' }}>
                                <span className="item-detail-label">צבע:</span>
                                <div className="color-badge">
                                  {item.colorHex && (
                                    <span 
                                      className="color-preview" 
                                      style={{ backgroundColor: item.colorHex }}
                                      title={item.color}
                                    ></span>
                                  )}
                                  <span>{item.color}</span>
                                </div>
                              </div>
                            )}
                            <div className="sizes-grid">
                              {Object.entries(item.sizes)
                                .filter(([_, qty]) => qty > 0)
                                .map(([size, qty]) => (
                                  <div key={size} className="size-badge">
                                    <span className="size-label">{size}</span>
                                    <span className="size-qty">×{qty}</span>
                                  </div>
                                ))}
                            </div>
                            <div className="item-detail-row" style={{ marginTop: '0.5rem' }}>
                              <span className="item-detail-label">סה"כ:</span>
                              <span className="item-detail-value" style={{ fontWeight: 600 }}>
                                {totalQty} יחידות
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            {item.color && (
                              <div className="item-detail-row">
                                <span className="item-detail-label">צבע:</span>
                                <div className="color-badge">
                                  {item.colorHex && (
                                    <span 
                                      className="color-preview" 
                                      style={{ backgroundColor: item.colorHex }}
                                      title={item.color}
                                    ></span>
                                  )}
                                  <span>{item.color}</span>
                                </div>
                              </div>
                            )}
                            <div className="item-detail-row">
                              <span className="item-detail-label">כמות:</span>
                              <span className="item-detail-value" style={{ fontWeight: 600 }}>
                                {item.qty || 0} יחידות
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {order.notes && (
            <div className="order-notes">
              <strong>הערות:</strong> {order.notes}
            </div>
          )}

          {/* הצגת לוגואים שהועלו */}
          {order.logos && (
            <div className="order-logos">
              {/* לוגואים מקוריים שהועלו */}
              {order.logos.uploads && Object.keys(order.logos.uploads).length > 0 && (
                <div>
                  <div className="order-logos-title">🎨 לוגואים שהועלו:</div>
                  <div className="logos-grid">
                    {Object.entries(order.logos.uploads).map(([key, logoUrl]) => {
                      if (!logoUrl) return null;
                      // טיפול במקרה שזה אובייקט ולא string
                      const url = typeof logoUrl === 'string' ? logoUrl : logoUrl?.url || logoUrl?.fileUrl || '';
                      if (!url) return null;
                      
                      return (
                        <div key={key} className="logo-item">
                          <img 
                            src={url} 
                            alt={key}
                            className="logo-preview"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div className="logo-label" style={{ display: 'none' }}>
                            ❌ שגיאה בטעינה
                          </div>
                          <div className="logo-label">{key}</div>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="logo-link"
                          >
                            פתח קובץ
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* mockups - תצוגות מקדימות */}
              {order.logos.mockups && order.logos.mockups.length > 0 && (
                <div className="mockups-section">
                  <div className="mockups-title">📸 Mockups:</div>
                  <div className="logos-grid">
                    {order.logos.mockups.map((mockupUrl, idx) => {
                      if (!mockupUrl) return null;
                      return (
                        <div key={idx} className="logo-item">
                          <img 
                            src={mockupUrl} 
                            alt={`Mockup ${idx + 1}`}
                            className="logo-preview"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="logo-label">Mockup {idx + 1}</div>
                          <a 
                            href={mockupUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="logo-link"
                          >
                            פתח תמונה
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* לוגואים לפי פריט */}
              {order.logos.byItemFromCart && Object.keys(order.logos.byItemFromCart).length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="order-logos-title">🏷️ לוגואים לפי מוצר:</div>
                  {Object.entries(order.logos.byItemFromCart).map(([itemId, positions]) => {
                    const item = order.items?.find(i => i.productId === itemId);
                    const itemName = item?.productName || itemId;
                    
                    return (
                      <div key={itemId} style={{ marginBottom: '1rem' }}>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          color: '#495057',
                          marginBottom: '0.5rem',
                          padding: '0.5rem',
                          background: '#e9ecef',
                          borderRadius: '4px'
                        }}>
                          {itemName}
                        </div>
                        <div className="logos-grid">
                          {positions.front && (
                            <div className="logo-item">
                              <img 
                                src={positions.front} 
                                alt="לוגו חזית"
                                className="logo-preview"
                              />
                              <div className="logo-label">חזית</div>
                              <a 
                                href={positions.front} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="logo-link"
                              >
                                פתח קובץ
                              </a>
                            </div>
                          )}
                          {positions.back && (
                            <div className="logo-item">
                              <img 
                                src={positions.back} 
                                alt="לוגו גב"
                                className="logo-preview"
                              />
                              <div className="logo-label">גב</div>
                              <a 
                                href={positions.back} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="logo-link"
                              >
                                פתח קובץ
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* תצוגה ישנה של graphics (fallback) */}
          {!order.logos && order.graphics && order.graphics.length > 0 && (
            <div className="order-logos">
              <div className="order-logos-title">📎 קבצים מצורפים:</div>
              <div className="logos-grid">
                {order.graphics.map((graphic, idx) => (
                  <div key={graphic.id || idx} className="logo-item">
                    {graphic.fileUrl && graphic.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                      <img 
                        src={graphic.fileUrl} 
                        alt={graphic.label}
                        className="logo-preview"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="logo-preview" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '2rem'
                      }}>
                        📄
                      </div>
                    )}
                    <div className="logo-label">{graphic.label || 'קובץ ללא שם'}</div>
                    {graphic.fileUrl && (
                      <a 
                        href={graphic.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="logo-link"
                      >
                        פתח קובץ
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
