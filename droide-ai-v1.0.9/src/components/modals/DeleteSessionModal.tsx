import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteSessionModal: React.FC<DeleteSessionModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative z-10 bg-[var(--bg-main)] rounded-[32px] w-full max-w-sm flex flex-col shadow-2xl p-8 border border-[var(--surface-border)]"
          >
            <h3 className="text-2xl font-bold mb-3 text-[var(--text-primary)] tracking-tight">Delete Chat?</h3>
            <p className="text-[var(--text-secondary)] mb-8 text-sm leading-relaxed">
              This will permanently delete this conversation and all associated model memory for this session. This action cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { onConfirm(); onClose(); }} 
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg"
              >
                Permanently Delete
              </button>
              <button 
                onClick={onClose} 
                className="w-full py-3 rounded-2xl font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Keep Conversation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
