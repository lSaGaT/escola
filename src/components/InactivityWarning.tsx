import { motion, AnimatePresence } from 'motion/react';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InactivityWarningProps {
  show: boolean;
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  onExtend: () => void;
}

export function InactivityWarning({ show, timeRemaining, formatTime, onExtend }: InactivityWarningProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-2xl p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sessão Inativa</h3>
                  <p className="text-white/90 text-sm">Você será deslogado em breve</p>
                </div>
              </div>
            </div>

            <div className="bg-white/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-white/90 mb-2">
                Tempo restante:
              </p>
              <p className="text-3xl font-bold">
                {formatTime(timeRemaining)}
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={onExtend}
                className="w-full bg-white text-red-600 hover:bg-white/90 rounded-xl font-semibold"
              >
                Manter Conectado
              </Button>
              <p className="text-xs text-white/80 text-center">
                Mova o mouse ou clique para estender sua sessão
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
