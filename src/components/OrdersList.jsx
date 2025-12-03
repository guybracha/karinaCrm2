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
          </div>

          {order.items && order.items.length > 0 && (
            <div className="order-items">
              <div className="order-items-title">פריטים בהזמנה:</div>
              <div className="order-items-list">
                {order.items.map((item, idx) => {
                  const totalQty = item.sizes 
                    ? Object.values(item.sizes).reduce((sum, qty) => sum + (qty || 0), 0)
                    : item.qty || 0;
                  const totalPrice = item.unitPrice * totalQty;
                  
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
                        
                        {item.unitPrice && (
                          <div className="item-detail-row">
                            <span className="item-detail-label">מחיר יחידה:</span>
                            <span className="item-detail-value">₪{item.unitPrice.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {item.sizes && Object.keys(item.sizes).length > 0 ? (
                          <div>
                            <div className="item-detail-label" style={{ marginBottom: '0.5rem' }}>
                              כמויות לפי מידות:
                            </div>
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
                          <div className="item-detail-row">
                            <span className="item-detail-label">כמות:</span>
                            <span className="item-detail-value" style={{ fontWeight: 600 }}>
                              {item.qty || 0} יחידות
                            </span>
                          </div>
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

          {order.graphics && order.graphics.length > 0 && (
            <div className="order-detail-row" style={{ marginTop: '0.75rem' }}>
              <span className="order-detail-label">קבצים:</span>
              <span className="order-detail-value">{order.graphics.length} קבצים מצורפים</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
