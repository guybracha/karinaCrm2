import { useEffect, useState } from 'react';
import { fetchAllOrdersSortedByUser } from '../lib/customersApi';
import OrdersList from './OrdersList';

export default function OrdersListView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllOrdersSortedByUser();
      console.log('[OrdersListView] Loaded orders:', data);
      setOrders(data);
    } catch (err) {
      console.error('[OrdersListView] Error loading orders:', err);
      setError(err.message || 'שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  }

  // סינון הזמנות
  const filteredOrders = orders.filter((order) => {
    // סינון לפי חיפוש
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchLower) ||
      order.customer?.displayName?.toLowerCase().includes(searchLower) ||
      order.customer?.name?.toLowerCase().includes(searchLower) ||
      order.customer?.firstName?.toLowerCase().includes(searchLower) ||
      order.customer?.lastName?.toLowerCase().includes(searchLower) ||
      order.customer?.city?.toLowerCase().includes(searchLower) ||
      order.shipping?.address?.firstName?.toLowerCase().includes(searchLower) ||
      order.shipping?.address?.lastName?.toLowerCase().includes(searchLower) ||
      order.shipping?.address?.name?.toLowerCase().includes(searchLower) ||
      order.shipping?.address?.city?.toLowerCase().includes(searchLower) ||
      order.customer?.phoneNumber?.includes(searchTerm) ||
      order.shipping?.address?.phone?.includes(searchTerm) ||
      order.customer?.email?.toLowerCase().includes(searchLower) ||
      order.shipping?.address?.email?.toLowerCase().includes(searchLower);

    // סינון לפי סטטוס
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ספירת הזמנות לפי סטטוס
  const statusCounts = orders.reduce((acc, order) => {
    const status = order.status || 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="orders-list-view loading">
        <div className="loading-spinner"></div>
        <p>טוען הזמנות...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-list-view error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={loadOrders} className="retry-btn">
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="orders-list-view">
      <div className="orders-header">
        <div className="orders-title-section">
          <h2>הזמנות</h2>
          <span className="orders-count">{orders.length} הזמנות</span>
        </div>
        
        <button onClick={loadOrders} className="refresh-btn" title="רענן">
          🔄
        </button>
      </div>

      <div className="orders-filters">
        {/* חיפוש */}
        <div className="search-box">
          <input
            type="text"
            placeholder="חפש לפי מספר הזמנה, שם לקוח, עיר, טלפון או אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="search-clear"
              title="נקה חיפוש"
            >
              ✕
            </button>
          )}
        </div>

        {/* סינון לפי סטטוס */}
        <div className="status-filters">
          <button
            className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            הכל ({orders.length})
          </button>
          <button
            className={`status-filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            טיוטה ({statusCounts.draft || 0})
          </button>
          <button
            className={`status-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            ממתין ({statusCounts.pending || 0})
          </button>
          <button
            className={`status-filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
            onClick={() => setStatusFilter('processing')}
          >
            בתהליך ({statusCounts.processing || 0})
          </button>
          <button
            className={`status-filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            הושלם ({statusCounts.completed || 0})
          </button>
        </div>
      </div>

      {/* תוצאות החיפוש */}
      {searchTerm && (
        <div className="search-results-info">
          נמצאו {filteredOrders.length} תוצאות עבור "{searchTerm}"
        </div>
      )}

      {/* רשימת ההזמנות */}
      <div className="orders-content">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            {searchTerm || statusFilter !== 'all' ? (
              <>
                <div className="no-orders-icon">🔍</div>
                <h3>לא נמצאו הזמנות</h3>
                <p>נסה לשנות את קריטריוני החיפוש או הסינון</p>
              </>
            ) : (
              <>
                <div className="no-orders-icon">📦</div>
                <h3>אין הזמנות עדיין</h3>
                <p>ההזמנות שיתקבלו יופיעו כאן</p>
              </>
            )}
          </div>
        ) : (
          <OrdersList orders={filteredOrders} />
        )}
      </div>

      <style jsx>{`
        .orders-list-view {
          padding: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .orders-list-view.loading,
        .orders-list-view.error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .retry-btn {
          margin-top: 1rem;
          padding: 0.5rem 1.5rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .retry-btn:hover {
          background: #0056b3;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .orders-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .orders-title-section h2 {
          margin: 0;
          font-size: 1.75rem;
          color: #333;
        }

        .orders-count {
          background: #e9ecef;
          color: #495057;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .refresh-btn {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: #f8f9fa;
          transform: rotate(180deg);
        }

        .orders-filters {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .search-box {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 1rem;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }

        .search-clear {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .search-clear:hover {
          background: #5a6268;
        }

        .status-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .status-filter-btn {
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          color: #495057;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-filter-btn:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }

        .status-filter-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .search-results-info {
          background: #e7f3ff;
          border: 1px solid #b3d9ff;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          color: #004085;
          font-size: 0.9rem;
        }

        .orders-content {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .no-orders {
          text-align: center;
          padding: 3rem 1rem;
        }

        .no-orders-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .no-orders h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .no-orders p {
          margin: 0;
          color: #6c757d;
        }

        /* רספונסיביות */
        @media (max-width: 768px) {
          .orders-list-view {
            padding: 1rem;
          }

          .orders-title-section h2 {
            font-size: 1.5rem;
          }

          .orders-header {
            margin-bottom: 1rem;
          }

          .orders-filters {
            padding: 0.75rem;
          }

          .search-input {
            font-size: 0.9rem;
            padding: 0.6rem 0.75rem;
          }

          .status-filters {
            gap: 0.25rem;
          }

          .status-filter-btn {
            font-size: 0.85rem;
            padding: 0.4rem 0.75rem;
            flex: 1;
            min-width: 0;
            justify-content: center;
          }

          .orders-content {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .orders-list-view {
            padding: 0.5rem;
          }

          .orders-title-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .orders-title-section h2 {
            font-size: 1.25rem;
          }

          .orders-filters {
            padding: 0.5rem;
          }

          .search-input {
            font-size: 0.85rem;
            padding: 0.5rem;
          }

          .status-filters {
            flex-direction: column;
          }

          .status-filter-btn {
            width: 100%;
          }

          .orders-content {
            padding: 0.75rem;
          }

          .refresh-btn {
            padding: 0.4rem 0.75rem;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
