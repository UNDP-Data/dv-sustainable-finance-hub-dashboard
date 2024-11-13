import React from 'react';
import ReactDOM from 'react-dom/client';
import AppMap from './AppMap';

const getEl = (embedSelector: string) => {
  if (typeof embedSelector === 'string') {
    const el = document.querySelector(embedSelector);
    if (!el) {
      // eslint-disable-next-line no-console
      console.error(`No div matching selector "${embedSelector}"`);
      return null;
    }
    return el;
  }
  return embedSelector;
};

const vizApp = getEl('[data-viz-app-map]');
if (vizApp) {
  const rootEmbed = ReactDOM.createRoot(vizApp);
  rootEmbed.render(
    <React.StrictMode>
      <AppMap />
    </React.StrictMode>,
  );
}
