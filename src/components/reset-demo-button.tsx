'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ResetDemoButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function reset() {
    if (!window.confirm('Reset all demo data? This erases every saved review, memo and audit entry, for everyone.')) return;
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (!response.ok) {
        setError((await response.text()).slice(0, 300) || 'Could not reset the demo data.');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Could not reach the server. Nothing was changed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="resetdemo">
      <button type="button" onClick={reset} disabled={pending}>
        {pending ? 'Resetting…' : 'Reset demo data'}
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
