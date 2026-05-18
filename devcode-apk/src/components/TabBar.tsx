import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileNode } from '../types';
import { FileIcon } from '../lib/FileIcon';

interface TabBarProps {
  openFiles: FileNode[];
  activeFileId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}

export function TabBar({ openFiles, activeFileId, onTabClick, onTabClose }: TabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to active tab
    if (containerRef.current && activeFileId) {
      const activeTab = containerRef.current.querySelector('[data-active="true"]');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeFileId]);

  if (openFiles.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="flex overflow-x-auto bg-[#181818] border-b border-[#333] select-none h-9 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0"
    >
      {openFiles.map(file => {
        const isActive = activeFileId === file.id;
        return (
          <div
            key={file.id}
            data-active={isActive}
            onClick={() => onTabClick(file.id)}
            className={cn(
              "group flex items-center gap-2 px-3 py-1 min-w-fit max-w-[150px] border-r border-[#333] cursor-pointer transition-colors text-[12px]",
              isActive ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-500" : "bg-[#252526] text-gray-400 border-t-2 border-t-transparent hover:bg-[#2d2d2d]"
            )}
          >
            <FileIcon name={file.name} className="flex-shrink-0 w-3.5 h-3.5" />
            <span className="truncate flex-1 font-medium">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(file.id);
              }}
              className={cn(
                "p-0.5 rounded hover:bg-[#444] transition-colors ml-1",
                isActive ? "opacity-100 text-gray-300 hover:text-white" : "opacity-50 sm:opacity-0 group-hover:opacity-100 hover:text-white"
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
