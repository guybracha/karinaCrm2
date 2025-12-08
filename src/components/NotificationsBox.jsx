import { useState, useEffect } from 'react';
import { subscribeToNewOrders } from '../lib/customersApi';

export default function NotificationsBox() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // האזנה להזמנות חדשות
    const unsubscribe = subscribeToNewOrders(
      (newOrder) => {
        const notification = {
          id: newOrder.id,
          order: newOrder,
          timestamp: new Date(),
          read: false,
        };
        
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // השמעת צליל התרעה
        playNotificationSound();
      },
      (error) => {
        console.error('[NotificationsBox] Error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVKno7qxdGQk9ltryxnMpBSuAzvLZiTYIGGe77OmfUQ0NUKfk8LdjGgg5kdj0y3kvBSd4yPHdkUEKFGC16uyqVRQKR6Hh8bt0IQYyidPz0oQ0Bh9wxe/imFINDlOp6O+uXhoJPpja8sZ0KgYsgtDy2Yk2CBhqvOzpn1AOD1Gp5fC4ZBsIOZPZ9Mp6LgYnecjx3JFBChVhtevtqVYUCkik4/K8dSIGM4rU89OGNQcfcsXw45lSDg5Urunu') || new Audio();
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      console.error('[NotificationsBox] Failed to play sound:', error);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'עכשיו';
    if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דקות`;
    if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getCustomerName = (order) => {
    return order.customer?.displayName || 
           order.customer?.name || 
           order.customer?.firstName || 
           order.shipping?.address?.firstName || 
           'לקוח חדש';
  };

  return (
    <>
      {/* כפתור פתיחת התרעות */}
      <button
        className="notifications-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="התרעות"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notifications-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* תיבת התרעות */}
      {isOpen && (
        <div className="notifications-box">
          <div className="notifications-header">
            <h3>התרעות ({notifications.length})</h3>
            <div className="notifications-header-actions">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-read-btn" title="סמן הכל כנקרא">
                  ✓ סמן הכל כנקרא
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="clear-all-btn" title="נקה הכל">
                  🗑️
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="close-btn" title="סגור">
                ✕
              </button>
            </div>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notifications-icon">🔕</div>
                <p>אין התרעות חדשות</p>
              </div>
            ) : (
              [...notifications]
                .sort((a, b) => {
                  // מיון לפי תאריך ההזמנה (createdAt) - מהחדש לישן
                  const dateA = new Date(a.order.createdAt || a.timestamp);
                  const dateB = new Date(b.order.createdAt || b.timestamp);
                  return dateB - dateA;
                })
                .map((notification) => {
                const order = notification.order;
                const customerName = getCustomerName(order);
                const total = order.totals?.grandTotal || 0;

                return (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="notification-content">
                      <div className="notification-icon">
                        {notification.read ? '📦' : '🎉'}
                      </div>
                      <div className="notification-details">
                        <div className="notification-title">
                          הזמנה חדשה מ-{customerName}
                        </div>
                        <div className="notification-meta">
                          <span className="notification-order-id">
                            #{order.id.slice(-8)}
                          </span>
                          {total > 0 && (
                            <span className="notification-amount">
                              ₪{total.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="notification-time">
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                    <button
                      className="notification-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      title="הסר"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .notifications-toggle {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          transition: all 0.3s;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notifications-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }

        .notifications-toggle:active {
          transform: scale(0.95);
        }

        .notifications-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #dc3545;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 0.7rem;
          font-weight: bold;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .notifications-box {
          position: fixed;
          top: 80px;
          left: 20px;
          width: 400px;
          max-height: 600px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          z-index: 999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 2px solid #e9ecef;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .notifications-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .notifications-header-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .mark-all-read-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .mark-all-read-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .clear-all-btn,
        .close-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .clear-all-btn:hover,
        .close-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .notifications-list {
          overflow-y: auto;
          max-height: 540px;
          padding: 0.5rem;
        }

        .no-notifications {
          text-align: center;
          padding: 3rem 1rem;
          color: #6c757d;
        }

        .no-notifications-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }

        .no-notifications p {
          margin: 0;
          font-size: 0.9rem;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.875rem;
          margin-bottom: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
          cursor: pointer;
          border: 1px solid #e9ecef;
        }

        .notification-item.unread {
          background: linear-gradient(135deg, #e7f3ff 0%, #f0e7ff 100%);
          border-color: #b3d9ff;
        }

        .notification-item.read {
          background: #f8f9fa;
          opacity: 0.7;
        }

        .notification-item:hover {
          transform: translateX(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .notification-content {
          display: flex;
          gap: 0.75rem;
          flex: 1;
        }

        .notification-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .notification-details {
          flex: 1;
        }

        .notification-title {
          font-weight: 600;
          color: #212529;
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }

        .notification-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .notification-order-id {
          font-family: monospace;
          font-size: 0.8rem;
          color: #6c757d;
          background: rgba(0,0,0,0.05);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .notification-amount {
          font-weight: 700;
          color: #28a745;
          font-size: 0.9rem;
        }

        .notification-time {
          font-size: 0.75rem;
          color: #6c757d;
        }

        .notification-remove-btn {
          background: transparent;
          border: none;
          color: #6c757d;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 0.25rem;
          opacity: 0;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .notification-item:hover .notification-remove-btn {
          opacity: 1;
        }

        .notification-remove-btn:hover {
          color: #dc3545;
        }

        /* רספונסיביות */
        @media (max-width: 768px) {
          .notifications-toggle {
            top: 15px;
            left: 15px;
            width: 45px;
            height: 45px;
            font-size: 1.3rem;
          }

          .notifications-box {
            top: 70px;
            left: 15px;
            right: 15px;
            width: auto;
            max-height: 500px;
          }

          .notifications-header {
            padding: 0.875rem 1rem;
          }

          .notifications-header h3 {
            font-size: 1rem;
          }

          .mark-all-read-btn {
            padding: 0.3rem 0.6rem;
            font-size: 0.7rem;
          }

          .notification-item {
            padding: 0.75rem;
          }

          .notification-title {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .notifications-box {
            top: 65px;
            left: 10px;
            right: 10px;
            max-height: calc(100vh - 80px);
          }

          .notification-content {
            gap: 0.5rem;
          }

          .notification-icon {
            font-size: 1.25rem;
          }

          .mark-all-read-btn {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
