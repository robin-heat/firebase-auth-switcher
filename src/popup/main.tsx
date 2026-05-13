import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

if (!localStorage.getItem('devtools')) {
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook) hook.isDisabled = true;
}

// t=0 is when this script was executed by Chrome after html+js parse
const t0 = performance.now();
console.log(`[popup] script start  +${t0.toFixed(0)}ms from navigation`);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log(`[popup] render() called  +${(performance.now() - t0).toFixed(0)}ms`);
