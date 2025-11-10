import { useEffect, useState } from 'react';
import {
  fetchCustomerById,
  saveCustomerGraphics,
  saveProductionSteps,
} from '../lib/customersApi';
import { fetchCustomerGraphicsFromStorage } from '../lib/storage';
import GraphicsList from './GraphicsList';
import ProductionSteps from './ProductionSteps';

export default function CustomerDetails({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingGraphics, setUpdatingGraphics] = useState(false);
  const [updatingSteps, setUpdatingSteps] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  function getOrderLabel(order, index) {
    const suffix = order.orderNumber || order.reference || order.id?.slice(-6) || index + 1;
    const dateLabel = order.createdAt
      ? ` · ${new Date(order.createdAt).toLocaleDateString()}`
      : '';
    return `הזמנה ${suffix}${dateLabel}`;
  }

  useEffect(() => {
    let isMounted = true;
    async function loadCustomer() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCustomerById(customerId);
        let storageGraphics = null;
        if (data) {
          const folderId = data.firebaseUid || data.id;
          storageGraphics = await fetchCustomerGraphicsFromStorage(folderId).catch(
            (err) => {
              console.warn('Unable to load graphics from Storage', err);
              return null;
            },
          );
        }
        if (isMounted) {
          const graphicsOverride =
            storageGraphics && storageGraphics.length > 0
              ? storageGraphics
              : data?.graphics;
          const nextCustomer = data ? { ...data, graphics: graphicsOverride } : null;
          setCustomer(nextCustomer);
          setSelectedOrderId(nextCustomer?.orders?.[0]?.id || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'לא הצלחנו לטעון את הלקוח.');
          setCustomer(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    if (customerId) {
      loadCustomer();
    }
    return () => {
      isMounted = false;
    };
  }, [customerId]);

  async function handleGraphicsChange(nextGraphics) {
    if (!customer?.id) return;
    setUpdatingGraphics(true);
    setError(null);
    try {
      const updated = await saveCustomerGraphics(customer.id, nextGraphics, selectedOrderId || null);
      setCustomer(updated);
      const fallbackOrderId = updated.orders?.[0]?.id || null;
      if (selectedOrderId && !updated.orders?.some((order) => order.id === selectedOrderId)) {
        setSelectedOrderId(fallbackOrderId);
      } else if (!selectedOrderId && fallbackOrderId) {
        setSelectedOrderId(fallbackOrderId);
      }
    } catch (err) {
      setError(err.message || 'שמירת קבצי הגרפיקה נכשלה.');
    } finally {
      setUpdatingGraphics(false);
    }
  }

  async function handleStepsChange(nextSteps) {
    if (!customer?.id) return;
    if ((customer.orders?.length || 0) > 0 && !selectedOrderId) {
      setError('בחר הזמנה כדי לעדכן את תהליך הייצור.');
      return;
    }
    setUpdatingSteps(true);
    setError(null);
    try {
      const targetOrderId = selectedOrderId || customer.orders?.[0]?.id || null;
      const updated = await saveProductionSteps(customer.id, nextSteps, targetOrderId);
      setCustomer(updated);
      const fallbackOrderId = updated.orders?.[0]?.id || null;
      if (targetOrderId && !updated.orders?.some((order) => order.id === targetOrderId)) {
        setSelectedOrderId(fallbackOrderId);
      } else if (!selectedOrderId && fallbackOrderId) {
        setSelectedOrderId(fallbackOrderId);
      }
    } catch (err) {
      setError(err.message || 'שמירת שלבי הייצור נכשלה.');
    } finally {
      setUpdatingSteps(false);
    }
  }

  if (loading) {
    return <p className="status-message">טוען פרטי לקוח...</p>;
  }

  if (!customer) {
    return <p className="status-message">לא נמצא לקוח.</p>;
  }

  const availableOrders = customer.orders || [];
  const activeOrder =
    availableOrders.find((order) => order.id === selectedOrderId) ||
    availableOrders[0] ||
    null;
  const stepsToDisplay = activeOrder?.productionSteps || customer.productionSteps || [];

  return (
    <div className="customer-details">
      {error && <p className="status-message error">{error}</p>}
      <div className="customer-header">
        <h2>{customer.name}</h2>
        {customer.company && <p>חברה: {customer.company}</p>}
        {customer.phone && <p>טלפון: {customer.phone}</p>}
        {customer.email && <p>אימייל: {customer.email}</p>}
        {customer.notes && <p>הערות: {customer.notes}</p>}
      </div>

      <section>
        <h3>קבצי גרפיקה</h3>
        <GraphicsList
          graphics={customer.graphics || []}
          onChange={handleGraphicsChange}
          disabled={updatingGraphics}
          folderId={customer.firebaseUid || customer.id}
        />
      </section>

      <section>
        <h3>תהליך ייצור</h3>
        {availableOrders.length > 0 ? (
          <div className="order-selector">
            <label>
              בחר הזמנה
              <select
                value={selectedOrderId || availableOrders[0]?.id || ''}
                onChange={(event) => setSelectedOrderId(event.target.value)}
                disabled={updatingSteps}
              >
                {availableOrders.map((order, index) => (
                  <option key={order.id} value={order.id}>
                    {getOrderLabel(order, index)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <p className="status-message">אין הזמנות פעילות ללקוח זה.</p>
        )}
        <ProductionSteps
          steps={stepsToDisplay}
          onChange={handleStepsChange}
          disabled={updatingSteps}
        />
      </section>
    </div>
  );
}
