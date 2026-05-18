import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { FileNode } from '../types';
import { FileIcon } from '../lib/FileIcon';

interface FindInFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileNode[];
  onFileSelect: (id: string) => void;
}

export function FindInFilesModal({ isOpen, onClose, files, onFileSelect }: FindInFilesModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ file: FileNode; matches: { line: number; content: string }[] }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      const newResults = files.map(file => {
        const lines = file.content.split('\n');
        const matches = lines
          .map((content, index) => ({ line: index + 1, content }))
          .filter(match => match.content.toLowerCase().includes(lowerQuery));
        return { file, matches };
      }).filter(result => result.matches.length > 0);
      setResults(newResults);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, files]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#1e1e1e] pt-safe"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333]">
        <Search className="w-4.5 h-4.5 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Find in files..."
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-[14px]"
        />
        <button onClick={onClose} className="p-1 active:bg-[#333] hover:bg-[#333] rounded transition-colors shrink-0">
          <X className="w-4.5 h-4.5 text-gray-400" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div className="py-1">
            {results.map(({ file, matches }) => (
              <div key={file.id} className="mb-2">
                <div className="flex items-center gap-2 px-4 py-1 text-[13px] font-semibold text-blue-400 bg-[#252526]">
                  <FileIcon name={file.name} className="flex-shrink-0 w-4 h-4" />
                  <span className="truncate flex-1 uppercase tracking-tight opacity-90">{file.name}</span>
                  <span className="ml-auto text-[10px] text-gray-500 bg-[#333] px-1.5 py-0.5 rounded-full font-bold">{matches.length}</span>
                </div>
                {matches.map(match => (
                  <button
                    key={`${file.id}-${match.line}`}
                    onClick={() => {
                      onFileSelect(file.id);
                      onClose();
                    }}
                    className="w-full text-left px-4 py-1.5 hover:bg-[#2a2a2a] active:bg-[#333] flex gap-3 text-[13px] transition-colors"
                  >
                    <span className="text-gray-500 w-8 text-right shrink-0">{match.line}</span>
                    <span className="text-gray-300 truncate font-mono text-[12px] mt-0.5 opacity-85">
                      {match.content.trim()}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="p-8 text-center text-gray-500 text-[13px]">
            No matches found for "{query}"
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 text-[13px] flex flex-col items-center gap-3">
            <Search className="w-7 h-7 opacity-50" />
            <p>Type to search across all files in your workspace.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
