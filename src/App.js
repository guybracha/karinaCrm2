import { useEffect, useState } from 'react';
import CustomerDetails from './components/CustomerDetails';
import CustomerList from './components/CustomerList';
import LoginPanel from './components/LoginPanel';
import NotificationsBox from './components/NotificationsBox';
import OrdersListView from './components/OrdersListView';
import { onAuthStateChanged, signOutUser } from './lib/auth';
import './App.css';

const isTestEnv = process.env.NODE_ENV === 'test';

function App() {
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' או 'orders'
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(isTestEnv);

  useEffect(() => {
    if (isTestEnv) {
      setUser({ uid: 'test-user', displayName: 'Test User', email: 'test@karina.local' });
      return undefined;
    }
    const unsubscribe = onAuthStateChanged((current) => {
      setUser(current);
      setSelectedCustomerId(null);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  if (!authReady) {
    return (
      <div className="app loading-state">
        <p>Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="app" dir="rtl">
      {/* תיבת התרעות על הזמנות חדשות */}
      {user && <NotificationsBox />}
      
      <header className="app-header">
        <div>
          <h1>Karina CRM</h1>
          <p>ניהול לקוחות, גרפיקות ולוגואים</p>
        </div>
        {user && (
          <div className="user-box">
            <div>
              <strong>{user.displayName || user.email}</strong>
              <small>{user.email}</small>
            </div>
            <button className="ghost" onClick={signOutUser}>
              Sign out
            </button>
          </div>
        )}
      </header>

      {user ? (
        <main className="app-main">
          {/* טאבים */}
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('customers');
                setSelectedCustomerId(null);
              }}
            >
              👥 לקוחות
            </button>
            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('orders');
                setSelectedCustomerId(null);
              }}
            >
              📦 הזמנות
            </button>
          </div>

          {/* תוכן הטאבים */}
          {activeTab === 'customers' ? (
            <>
              <section className="left-panel">
                <CustomerList
                  onSelect={setSelectedCustomerId}
                  selectedId={selectedCustomerId}
                />
              </section>
              <section className="right-panel">
                {selectedCustomerId ? (
                  <CustomerDetails customerId={selectedCustomerId} />
                ) : (
                  <div className="empty-state">
                    <p>בחרו לקוח כדי לצפות בפרטים ובקבצים שלו</p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="full-panel">
              <OrdersListView />
            </section>
          )}
        </main>
      ) : (
        <main className="auth-panel">
          <LoginPanel />
        </main>
      )}
    </div>
  );
}

export default App;
