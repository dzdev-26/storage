import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';
import { FileNode } from '../types';
import { FileIcon } from '../lib/FileIcon';

interface QuickOpenModalProps {
  files: FileNode[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function QuickOpenModal({ files, onSelect, onClose }: QuickOpenModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center p-4 pt-16" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-[#252526] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col border border-[#333] h-fit max-h-[60vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-2 border-b border-[#333]">
          <Search className="w-4 h-4 text-gray-400 mr-3" />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search files by name..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-[13px]"
          />
        </div>
        
        <div className="overflow-y-auto py-1 flex-1">
          {filteredFiles.map(file => (
            <button
              key={file.id}
              onClick={() => onSelect(file.id)}
              className="flex items-center w-full px-4 py-1.5 hover:bg-[#2a2a2a] active:bg-[#333] transition-colors text-left"
            >
              <FileIcon name={file.name} className="flex-shrink-0 w-4 h-4" />
              <span className="ml-3 text-gray-300 text-[13px]">{file.name}</span>
            </button>
          ))}
          {filteredFiles.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-500 text-[13px]">
              No files found matching "{query}"
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
