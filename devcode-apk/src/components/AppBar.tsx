import React from 'react';
import { Menu, Play, Save, Settings, X, Search, FileSearch } from 'lucide-react';

interface AppBarProps {
  title: string;
  onMenuClick: () => void;
  onSettingsClick: () => void;
  onSearchClick: () => void;
  onFindInFilesClick: () => void;
  onPlayClick: () => void;
  onSaveClick: () => void;
  showPreview: boolean;
}

export function AppBar({ title, onMenuClick, onSettingsClick, onSearchClick, onFindInFilesClick, onPlayClick, onSaveClick, showPreview }: AppBarProps) {
  return (
    <div className="h-12 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-2 sm:px-4 shrink-0 shadow-sm z-10 relative select-none pt-safe">
      <div className="flex items-center min-w-0 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-1.5 sm:p-2 active:bg-[#333] hover:bg-[#2a2a2a] rounded-full transition-colors shrink-0"
        >
          <Menu className="w-5 h-5 text-gray-200" />
        </button>
        <span className="ml-2 sm:ml-3 font-semibold text-[14px] text-gray-100 truncate tracking-tight uppercase opacity-90">
          {title}
        </span>
      </div>
      <div className="flex items-center shrink-0">
        <button 
          onClick={onSearchClick}
          className="p-1.5 sm:p-2 active:bg-[#333] hover:bg-[#2a2a2a] rounded-full transition-colors"
          title="Quick Open / Go to File"
        >
          <Search className="w-4.5 h-4.5 text-gray-300" />
        </button>
        <button 
          onClick={onFindInFilesClick}
          className="p-1.5 sm:p-2 active:bg-[#333] hover:bg-[#2a2a2a] rounded-full transition-colors"
          title="Find in Files"
        >
          <FileSearch className="w-4.5 h-4.5 text-gray-300" />
        </button>
        <button 
          onClick={onSettingsClick}
          className="p-1.5 sm:p-2 active:bg-[#333] hover:bg-[#2a2a2a] rounded-full transition-colors"
        >
          <Settings className="w-4.5 h-4.5 text-gray-300" />
        </button>
        <button 
          onClick={onSaveClick}
          className="p-1.5 sm:p-2 active:bg-[#333] hover:bg-[#2a2a2a] rounded-full transition-colors"
        >
          <Save className="w-4.5 h-4.5 text-gray-300" />
        </button>
        {showPreview && (
          <button 
            onClick={onPlayClick}
            className="p-1.5 sm:p-2 active:bg-[#333] hover:bg-[#2a2a2a] rounded-full transition-colors ml-0.5"
          >
            <Play className="w-4.5 h-4.5 text-green-400 fill-green-400" />
          </button>
        )}
      </div>
    </div>
  );
}
