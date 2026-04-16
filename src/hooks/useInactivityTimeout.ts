import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';

/**
 * Hook para gerenciar timeout de sessão por inatividade
 * @param timeoutMinutes - Tempo de inatividade em minutos (padrão: 30)
 * @param warningMinutes - Tempo antes do logout para mostrar aviso (padrão: 5)
 */
export function useInactivityTimeout(
  timeoutMinutes: number = 30,
  warningMinutes: number = 5
) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Converter minutos para milissegundos
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

  // Função para resetar os timers
  const resetTimers = () => {
    // Limpar todos os timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Esconder aviso
    setShowWarning(false);
    setTimeRemaining(0);

    // Configurar timer de aviso (se houver tempo de aviso)
    if (warningMinutes > 0 && warningMs > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setTimeRemaining(warningMinutes * 60);

        // Iniciar contagem regressiva
        intervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningMs);
    }

    // Configurar timer de logout
    timeoutRef.current = setTimeout(async () => {
      await handleLogout();
    }, timeoutMs);
  };

  // Função de logout
  const handleLogout = async () => {
    // Limpar todos os timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Fazer logout
    await supabase.auth.signOut();

    // A página será recarregada automaticamente pelo listener de auth
    window.location.href = '/';
  };

  // Função para estender a sessão (quando usuário clica no aviso)
  const extendSession = () => {
    resetTimers();
  };

  // Configurar listeners de atividade
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Adicionar listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimers);
    });

    // Iniciar timers na montagem
    resetTimers();

    // Limpar listeners ao desmontar
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimers);
      });

      // Limpar timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Formatar tempo restante para exibição
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    showWarning,
    timeRemaining,
    formatTimeRemaining,
    extendSession,
    resetTimers
  };
}
