import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createIdbStore } from './data/idbStore';
import { StoreContext } from './data/useStore';
import './styles.css';

const store = createIdbStore();
// Ask the browser not to clear this app's data when the phone runs low on space.
void navigator.storage?.persist?.().catch(() => undefined);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreContext.Provider value={store}>
      <App />
    </StoreContext.Provider>
  </StrictMode>,
);
