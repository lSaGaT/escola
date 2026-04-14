import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ProfessorCadastro from './pages/ProfessorCadastro';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProfessorCadastro />
  </StrictMode>,
);
