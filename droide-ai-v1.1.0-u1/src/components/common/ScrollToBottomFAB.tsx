import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScrollToBottomFABProps {
  isVisible: boolean;
  onClick: () => void;
}

export const ScrollToBottomFAB: React.FC<ScrollToBottomFABProps> = ({ isVisible, onClick }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClick}
          className="fixed bottom-24 right-4 w-11 h-11 bg-[var(--surface-variant)] text-[var(--accent)] rounded-full shadow-lg border border-[var(--surface-border)] flex items-center justify-center z-[40] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
