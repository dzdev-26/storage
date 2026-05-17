import React from 'react';
import { ChevronDown, Eye, Music, Video, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from '../chat/BrandLogo';

interface Model {
  id: string;
  displayName: string;
  providerId: string;
  modelId?: string;
  caps?: { vision: boolean; audio: boolean; video: boolean; context: string; speed: string };
}

interface ModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  selectedModelId: string;
  onSelect: (id: string) => void;
  detectedCaps: Record<string, any>;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  isOpen,
  onClose,
  models,
  selectedModelId,
  onSelect,
  detectedCaps
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[140]"
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-[var(--bg-main)] rounded-3xl shadow-2xl z-[150] overflow-hidden flex flex-col max-h-[80%] border border-[var(--border-drawer)]"
          >
            <div className="p-5 bg-[var(--bg-main)] border-b border-[var(--border-drawer)] flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Select Model</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-[var(--surface-hover)] rounded-full transition-colors">
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="overflow-y-auto no-scrollbar pb-4 p-2 space-y-1">
              {models.map(model => {
                const isSelected = selectedModelId === model.id;
                const caps = detectedCaps[model.id] || model.caps;
                return (
                  <button 
                    key={model.id} 
                    onClick={() => { onSelect(model.id); onClose(); }}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-[0.98]
                      ${isSelected ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-sm
                        ${isSelected ? 'bg-white border-[var(--accent)]/30' : 'bg-[var(--surface)] border-[var(--surface-border)]'}`}>
                         <BrandLogo className={`w-7 h-7 ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--logo-color)]'}`} />
                      </div>
                      <div className="flex flex-col gap-1 text-left">
                        <div className={`text-[15px] leading-tight ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                          {model.displayName}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider opacity-60">
                            {model.providerId === 'google' ? 'Google OS' : 'Custom'}
                          </span>
                          {caps && (
                            <div className="flex items-center gap-1.5">
                              {caps.vision && <Eye className="w-3 h-3 text-[var(--accent)]" />}
                              {caps.audio && <Music className="w-3 h-3 text-blue-500" />}
                              {caps.video && <Video className="w-3 h-3 text-red-500" />}
                              <span className="text-[9px] text-[var(--text-muted)] font-mono font-bold tracking-tighter">{caps.context}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] p-1 flex items-center justify-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--surface-border)] opacity-40 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
