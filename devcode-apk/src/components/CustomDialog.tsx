import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { FileIcon } from '../lib/FileIcon';

interface CustomDialogProps {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message?: string;
  defaultValue?: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export function CustomDialog({ isOpen, type, title, message, defaultValue = '', onConfirm, onCancel }: CustomDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen && type === 'prompt' && inputRef.current) {
      setInputValue(defaultValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, type, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && type !== 'prompt') handleSubmit();
  };

  const isFileNamePrompt = type === 'prompt' && (title.toLowerCase().includes('file') || title.toLowerCase().includes('rename'));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onCancel}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-[#1e1e1e] w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-[#333] flex flex-col relative z-10"
        role="dialog"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="p-4 border-b border-[#333] flex justify-between items-center text-white">
          <h2 className="font-semibold text-[15px] tracking-tight">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white p-1 rounded-full active:bg-[#333]">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        
        <div className="p-4 flex flex-col gap-4">
          {message && <p className="text-[13px] text-gray-400 leading-relaxed">{message}</p>}
          
          {type === 'prompt' && (
            <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-[#2a2a2a] border border-[#444] rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all p-0.5">
              {isFileNamePrompt && (
                <div className="pl-2 flex items-center">
                  <FileIcon name={inputValue} className="w-5 h-5" />
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-transparent text-white p-2 outline-none font-sans text-[13px]"
                placeholder="Name..."
                spellCheck={false}
                autoFocus
              />
            </form>
          )}
        </div>

        <div className="px-4 py-2 bg-[#252526] border-t border-[#333] flex justify-end gap-2.5 rounded-b-xl">
          {type !== 'alert' && (
            <button
              onClick={onCancel}
              className="px-4 py-1.5 text-[13px] font-medium text-gray-300 hover:text-white hover:bg-[#333] rounded-lg transition-colors border border-transparent"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="px-5 py-1.5 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            {type === 'alert' ? 'OK' : type === 'confirm' ? 'Confirm' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
