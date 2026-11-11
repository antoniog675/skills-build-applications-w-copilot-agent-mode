import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  emptyMessage: string;
  renderItems: (data: T) => ReactNode[];
};

export function CapabilityCard<T>({ title, description, path, emptyMessage, renderItems }: Props<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<T>(path)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load data.');
      });
    return () => {
      active = false;
    };
  }, [path]);

  const items = data === null ? [] : renderItems(data);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error !== null ? (
          <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
        ) : data === null ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <ul>{items}</ul>
        )}
      </div>
    </section>
  );
}
