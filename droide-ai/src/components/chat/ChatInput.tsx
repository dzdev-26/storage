import React, { useState } from 'react';
import { Paperclip, Mic, Send, Square, Image as ImageIcon, X, BookMarked, Globe, Brain, Zap, Plus, Sparkles, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFileIcon } from '../../lib/fileIconRegistry';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
  onVoice: () => void;
  onFileClick: () => void;
  onOpenPromptLibrary: () => void;
  isGenerating: boolean;
  pendingImages: { name?: string, mimeType: string, isUrl?: boolean, data: string }[];
  removePendingImage: (index: number) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  wordCount: number;
  // New props for toggles
  discoveryEnabled: boolean;
  onToggleDiscovery: () => void;
  adaptiveThinking: boolean;
  onToggleAdaptiveThinking: () => void;
  generateMemory: boolean;
  onToggleMemory: () => void;
  caretStyle?: 'bar' | 'underscore' | 'block' | 'dot' | 'slash';
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  onSend,
  onStop,
  onVoice,
  onFileClick,
  onOpenPromptLibrary,
  isGenerating,
  pendingImages,
  removePendingImage,
  inputRef,
  handleKeyDown,
  wordCount,
  discoveryEnabled,
  onToggleDiscovery,
  adaptiveThinking,
  onToggleAdaptiveThinking,
  generateMemory,
  onToggleMemory,
  caretStyle = 'bar'
}) => {
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  
  const [selectionStart, setSelectionStart] = useState(0);
  const mirrorRef = React.useRef<HTMLDivElement>(null);

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setSelectionStart((e.target as HTMLTextAreaElement).selectionStart);
  };

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (mirrorRef.current) {
      mirrorRef.current.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
    }
  };

  React.useEffect(() => {
    if (inputRef.current && mirrorRef.current) {
      mirrorRef.current.scrollTop = inputRef.current.scrollTop;
    }
  });

  return (
    <div className="px-4 pb-4 bg-[var(--bg-main)]">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence>
          {pendingImages.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-3 mb-3 px-2 py-3 overflow-x-auto no-scrollbar scroll-smooth snap-x"
            >
              {pendingImages.map((img, i) => (
                <div key={i} className="relative group flex-shrink-0 snap-start mx-1 my-1">
                  <div className="w-14 h-14 rounded-xl border border-[var(--surface-border)] overflow-hidden bg-[var(--surface)] shadow-sm flex items-center justify-center">
                    {img.mimeType.startsWith('image/') || img.isUrl ? (
                      <img src={img.isUrl ? img.data : `data:${img.mimeType};base64,${img.data}`} alt="upload" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 text-[var(--text-secondary)]">
                        {getFileIcon(img.name || 'file', img.mimeType)}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => removePendingImage(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-lg active:scale-90 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex flex-col p-2 bg-[var(--surface)] rounded-[32px] border border-[var(--surface-border)] focus-within:border-[var(--accent)] transition-all shadow-sm">
          <div className="relative w-full">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); setSelectionStart(e.target.selectionStart); }}
              onSelect={handleSelect}
              onKeyUp={handleSelect}
              onClick={handleSelect}
              onScroll={syncScroll}
              onKeyDown={(e) => { handleSelect(e as any); handleKeyDown(e); }}
              placeholder="Ask DROIDE anything..."
              className="relative z-10 w-full px-4 py-2.5 bg-transparent border-none outline-none resize-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-base min-h-[44px] max-h-40 no-scrollbar select-text"
              style={{
                caretColor: caretStyle === 'bar' ? 'var(--caret-color)' : 'transparent',
              }}
            />
            {caretStyle !== 'bar' && (
              <div 
                ref={mirrorRef}
                className="absolute z-20 inset-0 pointer-events-none px-4 py-2.5 text-base whitespace-pre-wrap break-words overflow-hidden"
                aria-hidden="true"
                style={{
                   fontFamily: 'inherit',
                   lineHeight: 'inherit',
                   letterSpacing: 'inherit',
                }}
              >
                <span className="text-transparent">{inputText.slice(0, selectionStart)}</span>
                <span className="relative text-transparent">
                  &#8203;
                  <span 
                    className={`absolute left-0 animate-cursor-blink select-none shrink-0 pointer-events-none flex items-center justify-center`}
                    style={{
                       top: caretStyle === 'underscore' ? 'auto' : (caretStyle === 'block' ? '10%' : '50%'),
                       bottom: caretStyle === 'underscore' ? '-2px' : 'auto',
                       transform: (caretStyle !== 'underscore' && caretStyle !== 'block') ? 'translateY(-50%)' : 'none',
                       height: caretStyle === 'block' ? '80%' : 'auto',
                       width: caretStyle === 'block' ? '0.6em' : 'auto',
                       backgroundColor: caretStyle === 'block' ? 'var(--caret-color)' : 'transparent',
                       color: 'var(--caret-color)',
                       lineHeight: 1,
                       marginLeft: caretStyle === 'slash' ? '-1px' : (caretStyle === 'dot' ? '-3px' : '0'),
                       fontSize: caretStyle === 'dot' ? '1.5em' : 'inherit',
                       fontWeight: caretStyle === 'underscore' ? 900 : (caretStyle === 'slash' ? 700 : 'normal')
                    }}
                  >
                    {caretStyle === 'underscore' ? '_' : 
                     caretStyle === 'dot' ? '•' : 
                     caretStyle === 'slash' ? '/' : ''}
                  </span>
                </span>
                <span className="text-transparent">{inputText.slice(selectionStart)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-1 px-1 pb-1.5 min-h-[56px]">
            <div className="flex items-center gap-1 flex-1">
              {/* AI Tools Menu */}
              <div className="relative">
                <button 
                  onClick={() => { setIsAiMenuOpen(!isAiMenuOpen); setIsAttachMenuOpen(false); }}
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition-all android-ripple shrink-0 ${(discoveryEnabled || adaptiveThinking || generateMemory) ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-secondary)]'} ${isAiMenuOpen ? 'bg-[var(--surface-hover)]' : ''}`}
                  aria-label="AI Tools"
                >
                  <motion.div
                    animate={{ rotate: isAiMenuOpen ? 90 : 0, scale: isAiMenuOpen ? 0.9 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {isAiMenuOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isAiMenuOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60]" 
                        onClick={() => setIsAiMenuOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 5, x: 0 }}
                        animate={{ opacity: 1, scale: 1, y: -12, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 5, x: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute bottom-full left-0 z-[70] mb-2 p-1.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center gap-1"
                      >
                        <button 
                          onClick={() => { onToggleDiscovery(); setIsAiMenuOpen(false); }}
                          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${discoveryEnabled ? 'text-[var(--accent)] bg-[var(--accent)]/15 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
                          title="Search"
                        >
                          <Globe className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => { onToggleAdaptiveThinking(); setIsAiMenuOpen(false); }}
                          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${adaptiveThinking ? 'text-[var(--accent)] bg-[var(--accent)]/15 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
                          title="Thinking"
                        >
                          <Brain className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => { onToggleMemory(); setIsAiMenuOpen(false); }}
                          className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${generateMemory ? 'text-[var(--accent)] bg-[var(--accent)]/15 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
                          title="Memory"
                        >
                          <Zap className="w-5 h-5" />
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Attach Menu */}
              <div className="relative">
                <button 
                  onClick={() => { setIsAttachMenuOpen(!isAttachMenuOpen); setIsAiMenuOpen(false); }}
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition-all android-ripple shrink-0 text-[var(--text-secondary)] ${isAttachMenuOpen ? 'bg-[var(--surface-hover)]' : ''}`}
                  aria-label="Attachments"
                >
                  <motion.div
                    animate={{ rotate: isAttachMenuOpen ? 45 : 0, scale: isAttachMenuOpen ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Plus className="w-6 h-6" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isAttachMenuOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60]" 
                        onClick={() => setIsAttachMenuOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: -12 }}
                        exit={{ opacity: 0, scale: 0.8, y: 5 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute bottom-full left-0 z-[70] mb-2 p-1.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center gap-1"
                      >
                        <button 
                          onClick={() => { onFileClick(); setIsAttachMenuOpen(false); }}
                          className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] rounded-2xl transition-all"
                          aria-label="Upload file"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => { onVoice(); setIsAttachMenuOpen(false); }}
                          className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] rounded-2xl transition-all"
                          aria-label="Voice input"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={onOpenPromptLibrary}
                className="w-11 h-11 flex items-center justify-center rounded-full transition-all android-ripple shrink-0 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                aria-label="Open prompt library"
              >
                <BookMarked className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center shrink-0 ml-1">
              {isGenerating ? (
                <button
                  onClick={onStop}
                  className="w-11 h-11 flex items-center justify-center bg-[var(--danger)] text-white rounded-full shadow-md active:scale-90 transition-all android-ripple"
                  aria-label="Stop generation"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={onSend}
                  disabled={!inputText.trim() && pendingImages.length === 0}
                  className={`w-11 h-11 flex items-center justify-center rounded-full shadow-md active:scale-90 transition-all android-ripple
                    ${(!inputText.trim() && pendingImages.length === 0) 
                      ? 'bg-[var(--surface-variant)] text-[var(--text-muted)] cursor-not-allowed opacity-50' 
                      : 'bg-[var(--accent)] text-white shadow-[0_4px_12px_rgba(var(--accent-rgb),0.3)]'}`}
                  aria-label="Send message"
                >
                  <Send className="w-4.5 h-4.5 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
