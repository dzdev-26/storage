import React from 'react';
import { Undo, Redo, Scissors, Search, MessageSquareCode, AlignLeft, Code } from 'lucide-react';

interface QuickBarProps {
  onInsert: (text: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFormat?: () => void;
  onSearch?: () => void;
  onToggleComment?: () => void;
  onExpandEmmet?: () => void;
}

const KEYS = [
  '{', '}', '(', ')', '[', ']', '<', '>',
  '=', '+', '-', '*', '/', '&', '|', '!',
  ';', ':', '"', "'", '\`', ',', '.', '_'
];

export function QuickBar({ onInsert, onUndo, onRedo, onFormat, onSearch, onToggleComment, onExpandEmmet }: QuickBarProps) {
  return (
    <div className="h-10 bg-[#252526] border-t border-[#333] flex items-center px-1 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0">
      {onSearch && (
        <button onClick={onSearch} className="flex-shrink-0 min-w-[36px] h-7 mx-0.5 flex items-center justify-center text-gray-300 bg-[#333] rounded active:bg-[#4a4a4a] transition-colors select-none" title="Find/Replace">
          <Search className="w-3.5 h-3.5" />
        </button>
      )}
      {onUndo && (
        <button onClick={onUndo} className="flex-shrink-0 min-w-[36px] h-7 mx-0.5 flex items-center justify-center text-gray-300 bg-[#333] rounded active:bg-[#4a4a4a] transition-colors select-none">
          <Undo className="w-3.5 h-3.5" />
        </button>
      )}
      {onRedo && (
        <button onClick={onRedo} className="flex-shrink-0 min-w-[36px] h-7 mx-0.5 flex items-center justify-center text-gray-300 bg-[#333] rounded active:bg-[#4a4a4a] transition-colors select-none">
          <Redo className="w-3.5 h-3.5" />
        </button>
      )}
      {onFormat && (
        <button onClick={onFormat} className="flex-shrink-0 min-w-[36px] h-7 mx-0.5 flex items-center justify-center text-gray-300 bg-[#333] rounded active:bg-[#4a4a4a] transition-colors select-none" title="Format Code">
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
      )}
      {onExpandEmmet && (
        <button onClick={onExpandEmmet} className="flex-shrink-0 px-2 h-7 mx-0.5 flex items-center justify-center text-gray-300 bg-[#333] rounded active:bg-[#4a4a4a] transition-colors select-none font-bold text-[10px]" title="Expand Emmet">
          Emmet
        </button>
      )}
      {onToggleComment && (
        <button onClick={onToggleComment} className="flex-shrink-0 min-w-[36px] h-7 mx-0.5 flex items-center justify-center text-gray-300 bg-[#333] rounded active:bg-[#4a4a4a] transition-colors select-none" title="Toggle Comment">
          <MessageSquareCode className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="w-[1px] h-5 bg-[#444] mx-1 flex-shrink-0" />
      {KEYS.map((char, index) => (
        <button
          key={index}
          onClick={() => onInsert(char)}
          className="flex-shrink-0 min-w-[36px] h-7 mx-0.5 flex items-center justify-center text-[15px] font-mono text-gray-300 bg-[#333] rounded active:bg-[#4a4a4a] transition-colors select-none"
        >
          {char}
        </button>
      ))}
    </div>
  );
}
