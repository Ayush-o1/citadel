import { useState } from 'react';
import { itemsApi } from '../api/items.js';
import { useApi } from '../hooks/useApi.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';

// Reference implementation of the full stack pattern: loading/error/empty
// states, a service-layer call, and a simple create form. Copy this file as
// a starting point for a real feature page, then delete it.
export default function Items() {
  const { data: items, loading, error, refetch } = useApi(itemsApi.list, []);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await itemsApi.create({ name });
      setName('');
      await refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h1>Items</h1>

      <form onSubmit={handleSubmit} className="item-form">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New item name"
        />
        <button type="submit" disabled={submitting}>
          Add
        </button>
      </form>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && items?.length === 0 && (
        <EmptyState message="No items yet — add one above." />
      )}
      {!loading && !error && items?.length > 0 && (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
