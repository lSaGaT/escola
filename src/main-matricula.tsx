import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Matricula from './pages/Matricula';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Matricula />
  </StrictMode>,
);
