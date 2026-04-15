import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PasswordResetForm } from '../components/PasswordResetForm';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PasswordResetForm />
  </StrictMode>,
);
