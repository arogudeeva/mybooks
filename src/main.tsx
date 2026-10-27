import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ContainerProvider } from './app/ContainerContext';
import { createContainer } from './app/container';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ContainerProvider container={createContainer()}>
      <App />
    </ContainerProvider>
  </StrictMode>,
);
