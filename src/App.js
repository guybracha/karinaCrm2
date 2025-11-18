import { useEffect, useState } from 'react';
import CustomerDetails from './components/CustomerDetails';
import CustomerList from './components/CustomerList';
import LoginPanel from './components/LoginPanel';
import { onAuthStateChanged, signOutUser } from './lib/auth';
import './App.css';

const isTestEnv = process.env.NODE_ENV === 'test';

function App() {
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
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
