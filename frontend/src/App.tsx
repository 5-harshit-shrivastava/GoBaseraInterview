import { useEffect, useState } from 'react';
import { get } from './lib/api';

export default function App() {
  const [data, setData] = useState<any>();
  const [err, setErr] = useState<string>('');
  useEffect(() => {
    get('/health').then(setData).catch(e => setErr(e.message));
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <h1>Basera Interview — React + Nest (TS)</h1>
      {err ? <p>Error: {err}</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}