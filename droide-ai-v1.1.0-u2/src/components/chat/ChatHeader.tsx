import React from 'react';
import { Menu, Plus, ChevronDown, FileOutput, Trash2, FileType, FileText, FileJson } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface ChatHeaderProps {
  onMenuClick: () => void;
  onModelSelectorClick: () => void;
  onNewChatClick: () => void;
  onExportClick: (type: 'pdf' | 'md' | 'json' | 'clear') => void;
  selectedModelName: string;
  isExportMenuOpen: boolean;
  setIsExportMenuOpen: (open: boolean) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onMenuClick,
  onModelSelectorClick,
  onNewChatClick,
  onExportClick,
  selectedModelName,
  isExportMenuOpen,
  setIsExportMenuOpen
}) => {
  return (
    <header className="flex items-center justify-between px-2 h-14 shrink-0 bg-transparent z-20 top-0 relative">
      <button onClick={onMenuClick} className="p-3 bg-transparent rounded-full transition-colors android-ripple" aria-label="Open menu">
        <Menu className="w-6 h-6 text-[var(--text-primary)]" />
      </button>
      
      <button onClick={onModelSelectorClick} className="flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors android-ripple text-[var(--text-primary)] max-w-[60vw]" aria-label="Change model">
         <BrandLogo className="w-5 h-5 text-[var(--logo-color)] shrink-0" />
         <span className="font-semibold text-base truncate whitespace-nowrap overflow-hidden text-ellipsis">{selectedModelName}</span>
         <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
      </button>
      
      <div className="flex items-center">
        <div className="relative">
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
            className={`p-3 rounded-full transition-colors android-ripple ${isExportMenuOpen ? 'bg-[var(--surface-hover)] text-[var(--accent)]' : 'text-[var(--text-primary)]'}`} 
            aria-label="Export chat"
          >
            <FileOutput className="w-5 h-5" />
          </button>
          
          {isExportMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-main)] border border-[var(--surface-border)] rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 space-y-1">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--surface-border)] mb-1">Export Transcript</p>
                  <button onClick={() => { onExportClick('pdf'); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-red-500/10 hover:text-red-600 transition-colors android-ripple">
                    <FileType className="w-4 h-4" />
                    PDF Document
                  </button>
                  <button onClick={() => { onExportClick('md'); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-blue-500/10 hover:text-blue-600 transition-colors android-ripple">
                    <FileText className="w-4 h-4" />
                    Markdown File
                  </button>
                  <button onClick={() => { onExportClick('json'); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors android-ripple">
                    <FileJson className="w-4 h-4" />
                    JSON Archive
                  </button>
                  <button onClick={() => { onExportClick('clear'); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors android-ripple">
                    <Trash2 className="w-4 h-4" />
                    Clear Memory
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <button onClick={onNewChatClick} className="p-3 rounded-full transition-colors android-ripple" aria-label="New chat">
          <Plus className="w-6 h-6 text-[var(--text-primary)]" />
        </button>
      </div>
    </header>
  );
};
