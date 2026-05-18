import React from 'react';
import { FileNode, AppSettings, Language } from '../types';
import { AlignLeft, Braces } from 'lucide-react';
import { FileIcon } from '../lib/FileIcon';

interface StatusBarProps {
  activeFile: FileNode | undefined;
  settings: AppSettings;
  onLanguageChange?: (lang: Language) => void;
}

export function StatusBar({ activeFile, settings, onLanguageChange }: StatusBarProps) {
  if (!activeFile) return null;

  const lineCount = activeFile.content.split('\n').length;
  
  return (
    <div className="h-auto pb-safe flex-shrink-0 z-10 transition-colors" style={{ backgroundColor: settings.theme === 'github' ? '#005f9e' : '#007acc' }}>
      <div className="h-6 text-white text-[11px] flex items-center justify-between px-2 select-none overflow-hidden font-sans">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 opacity-95 cursor-default hover:bg-white/10 px-1 rounded-sm transition-colors" title="File Info">
            <FileIcon name={activeFile.name} className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium tracking-tight whitespace-nowrap">{activeFile.name}</span>
            <span className="text-[9px] opacity-70 ml-0.5">≡</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 hover:bg-white/10 px-1 rounded-sm transition-colors cursor-default opacity-90" title="Lines">
            <span>Ln {lineCount}</span>
          </div>
          <div className="flex items-center gap-1 hover:bg-white/10 px-1 rounded-sm transition-colors cursor-default opacity-90" title="Spaces">
            <span>Spaces: {settings.tabSize}</span>
          </div>
          <button 
            onClick={() => {
              const langs: Language[] = [
                'javascript', 'typescript', 'html', 'css', 'json', 'markdown', 
                'php', 'python', 'cpp', 'java', 'rust', 'sql', 'xml', 'yaml', 
                'sass', 'less', 'go', 'ruby', 'perl', 'swift', 'kotlin', 'scala',
                'shell', 'dart', 'erlang', 'haskell', 'lua', 'tcl', 'toml',
                'pug', 'clojure', 'vue', 'angular', 'liquid', 'text'
              ];
              const currentIdx = langs.indexOf(activeFile.language);
              const nextLang = langs[(currentIdx + 1) % langs.length];
              if (onLanguageChange) onLanguageChange(nextLang);
            }}
            className="hover:bg-white/10 px-1.5 py-0.5 rounded-sm transition-colors cursor-pointer opacity-95 capitalize font-medium active:bg-white/20"
            title="Click to cycle language"
          >
            {activeFile.language}
          </button>
        </div>
      </div>
    </div>
  );
}
