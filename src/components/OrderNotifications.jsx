import React, { useEffect, useState } from 'react';
import { 
  subscribeToNewOrders, 
  showOrderNotification, 
  requestNotificationPermission 
} from '../lib/customersApi';

/**
 * קומפוננטה להתרעות על הזמנות חדשות
 * ניתן להוסיף אותה ב-App.js או בכל מקום אחר שרץ כל הזמן
 */
export default function OrderNotifications() {
  const [newOrders, setNewOrders] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // בקשת הרשאה להתרעות בטעינה ראשונית
    requestNotificationPermission().then((granted) => {
      setNotificationsEnabled(granted);
      if (granted) {
        console.log('✅ התרעות מופעלות');
      } else {
        console.log('⚠️ התרעות לא מופעלות - המשתמש דחה או הדפדפן לא תומך');
      }
    });

    // התחלת האזנה להזמנות חדשות
    const unsubscribe = subscribeToNewOrders(
      (newOrder) => {
        console.log('🔔 הזמנה חדשה התקבלה:', newOrder);
        
        // הוספת ההזמנה לרשימת ההזמנות החדשות
        setNewOrders((prev) => [newOrder, ...prev].slice(0, 10)); // שמירת 10 אחרונות
        
        // הצגת התרעה
        showOrderNotification(newOrder);
        
        // אפשר להוסיף כאן גם צליל
        playNotificationSound();
      },
      (error) => {
        console.error('שגיאה במעקב אחר הזמנות:', error);
      }
    );

    // ניקוי ה-listener כשהקומפוננטה מתנתקת
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // פונקציה להפעלת צליל התרעה
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3'); // צריך להוסיף קובץ צליל
      audio.play().catch((err) => console.log('לא ניתן להפעיל צליל:', err));
    } catch (error) {
      // אם אין קובץ צליל, לא קורה כלום
    }
  };

  const handleDismiss = (orderId) => {
    setNewOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
  };

  // אם אין התרעות חדשות, לא מציגים כלום
  if (newOrders.length === 0) {
    return (
      <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 9999 }}>
        {!notificationsEnabled && (
          <div
            style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: 8,
              padding: '12px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxWidth: 300,
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
              🔕 התרעות מושבתות
            </div>
            <button
              onClick={handleEnableNotifications}
              style={{
                background: '#ffc107',
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              הפעל התרעות
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 9999 }}>
      {newOrders.map((order) => {
        // נסה למצוא את שם הלקוח מכל המקורות האפשריים
        const customerName = 
          order.customer?.displayName || 
          order.customer?.name || 
          order.customer?.firstName || 
          order.shipping?.address?.firstName || 
          order.shipping?.address?.name || 
          (order.shipping?.address?.firstName && order.shipping?.address?.lastName 
            ? `${order.shipping?.address?.firstName} ${order.shipping?.address?.lastName}` 
            : null) ||
          'לקוח חדש';
        
        const orderTotal = order.totals?.grandTotal || order.totals?.merchandiseTotal || 0;
        const shortOrderId = order.id.slice(-8);
        
        return (
          <div
            key={order.id}
            style={{
              background: '#d4edda',
              border: '1px solid #28a745',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxWidth: 320,
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6, fontSize: 15 }}>
                  🎉 הזמנה חדשה התקבלה!
                </div>
                <div style={{ fontSize: 15, marginBottom: 4, fontWeight: 600, color: '#155724' }}>
                  👤 {customerName}
                </div>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>
                  📦 מספר הזמנה: {shortOrderId}
                </div>
                {orderTotal > 0 && (
                  <div style={{ fontSize: 16, marginTop: 6, color: '#28a745', fontWeight: 'bold' }}>
                    💰 ₪{orderTotal.toFixed(2)}
                  </div>
                )}
                {order.customer?.phoneNumber && (
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                    📞 {order.customer.phoneNumber}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDismiss(order.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                  color: '#555',
                  lineHeight: 1,
                }}
                title="סגור"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
      
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
