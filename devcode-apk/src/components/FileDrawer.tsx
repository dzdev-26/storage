import React, { useRef, useState } from 'react';
import { FileNode } from '../types';
import { cn } from '../lib/utils';
import { 
  Folder, 
  Plus, 
  X, 
  Download, 
  Edit3, 
  Copy, 
  Upload, 
  Archive, 
  Search, 
  ChevronRight, 
  ChevronDown,
  FilePlus,
  FolderPlus,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FileIcon } from '../lib/FileIcon';

interface FileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileNode[];
  activeFileId: string | null;
  onFileSelect: (id: string) => void;
  onNewFile: (parentId: string | null) => void;
  onNewFolder: (parentId: string | null) => void;
  onToggleFolder: (id: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string) => void;
  onDownloadFile: (id: string) => void;
  onDuplicateFile: (id: string) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportWorkspace: () => void;
}

export function FileDrawer({ 
  isOpen, 
  onClose, 
  files, 
  activeFileId, 
  onFileSelect, 
  onNewFile, 
  onNewFolder,
  onToggleFolder,
  onDeleteFile, 
  onRenameFile, 
  onDownloadFile, 
  onDuplicateFile, 
  onUploadFile, 
  onExportWorkspace 
}: FileDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const renderTree = (parentId: string | null = null, level: number = 0) => {
    const items = files
      .filter(f => f.parentId === parentId)
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });

    return items.map(file => {
      if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        // If searching, we might still want to show parent folders if they contain matches
        // but for simplicity, let's just filter the whole list if we were doing a flat list.
        // For a tree, we'd need a more complex filter.
      }

      const isActive = activeFileId === file.id;
      const isFolder = file.type === 'folder';

      return (
        <div key={file.id}>
          <motion.div
            layout
            onClick={() => isFolder ? onToggleFolder(file.id) : onFileSelect(file.id)}
            className={cn(
              "relative flex items-center justify-between px-2 py-2 cursor-pointer select-none transition-all group overflow-hidden",
              isActive ? "bg-blue-500/15 text-white" : "text-gray-400 hover:bg-white/5 active:bg-white/10"
            )}
            style={{ paddingLeft: `${level * 12 + 12}px` }}
          >
            {isActive && (
              <motion.div 
                layoutId="activeIndicator"
                className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500" 
              />
            )}
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isFolder ? (
                <div className="flex items-center gap-1.5">
                  {file.isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  <Folder className={cn("w-4 h-4", file.isOpen ? "fill-blue-400/20 text-blue-400" : "text-gray-500")} />
                </div>
              ) : (
                <FileIcon name={file.name} className="w-4 h-4 flex-shrink-0" />
              )}
              <span className={cn(
                "truncate text-[13px] tracking-wide",
                isActive ? "font-bold text-blue-400" : isFolder ? "text-gray-300" : "font-normal"
              )}>
                {file.name}
              </span>
            </div>

            <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {isFolder && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onNewFile(file.id); }}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                    title="New File"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onNewFolder(file.id); }}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                    title="New Folder"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onRenameFile(file.id); }}
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                title="Rename"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
          
          <AnimatePresence>
            {isFolder && file.isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-l border-white/5 ml-[19px]"
                style={{ marginLeft: `${level * 12 + 19}px` }}
              >
                {renderTree(file.id, level + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  const filteredTree = () => {
    if (!searchQuery) return renderTree(null, 0);
    
    // Flat list during search for better usability
    return files
      .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(file => (
        <motion.div
          layout
          key={file.id}
          onClick={() => file.type === 'folder' ? onToggleFolder(file.id) : onFileSelect(file.id)}
          className={cn(
            "relative flex items-center justify-between px-4 py-2.5 cursor-pointer select-none transition-all group overflow-hidden",
            activeFileId === file.id ? "bg-blue-500/15 text-white" : "text-gray-400 hover:bg-white/5"
          )}
        >
          <div className="flex items-center gap-3">
            {file.type === 'folder' ? (
              <Folder className="w-4 h-4 text-blue-400" />
            ) : (
              <FileIcon name={file.name} className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-[13px]">{file.name}</span>
          </div>
        </motion.div>
      ));
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-[#121212] border-r border-[#2a2a2a] z-50 flex flex-col shadow-2xl pt-safe pb-safe"
          >
            {/* Explorer Header */}
            <div className="flex flex-col border-b border-[#2a2a2a] bg-[#1a1a1a]">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Explorer</span>
                <div className="flex items-center gap-0.5">
                  <button 
                    onClick={() => onNewFile(null)} 
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded"
                    title="New File"
                  >
                    <FilePlus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onNewFolder(null)} 
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded"
                    title="New Folder"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded"
                    title="Upload Files"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <X onClick={onClose} className="w-5 h-5 text-gray-500 ml-1 cursor-pointer hover:text-white" />
                </div>
              </div>
              
              <div className="px-3 pb-3">
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 group-focus-within:text-blue-400" />
                  <input
                    type="text"
                    placeholder="Search files"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#252526] border border-transparent focus:border-blue-500/50 rounded py-1.5 pl-8 pr-3 text-[12px] text-gray-200 outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={onUploadFile} 
            />

            {/* Tree View */}
            <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
              <div className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-gray-400 border-b border-white/5 bg-white/5 select-none">
                <ChevronDown className="w-3 h-3" />
                <span className="uppercase tracking-widest">Workspace</span>
              </div>
              
              <div className="pt-1">
                {filteredTree()}
              </div>

              {files.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-600">
                  <Folder className="w-12 h-12 mb-3 opacity-10" />
                  <p className="text-[13px]">Your workspace is empty</p>
                  <button 
                    onClick={() => onNewFile(null)}
                    className="mt-4 px-4 py-2 bg-blue-600/10 text-blue-400 rounded-lg text-[12px] font-semibold border border-blue-400/20 hover:bg-blue-600/20"
                  >
                    Create first file
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-between">
              <button 
                onClick={onExportWorkspace} 
                className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-white transition-colors"
              >
                <Archive className="w-4 h-4" />
                <span>Export ZIP</span>
              </button>
              <span className="text-[10px] text-gray-600 font-mono">v1.2.0</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
