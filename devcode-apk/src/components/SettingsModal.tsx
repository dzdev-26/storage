import React from 'react';
import { X, Settings2, Download, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FileNode } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onClose: () => void;
  files: FileNode[]; // For export
}

const THEMES = [
  { id: 'oneDark', name: 'One Dark' },
  { id: 'github', name: 'GitHub Light' },
  { id: 'vscode', name: 'VS Code Dark' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'tokyonight', name: 'Tokyo Night' },
  { id: 'monokai', name: 'Monokai' },
];

export function SettingsModal({ settings, onSettingsChange, onClose, files }: SettingsModalProps) {
  const handleChange = (key: keyof AppSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const exportProject = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.name, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'project.zip');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#1e1e1e] text-white pt-safe"
    >
      <div className="h-12 border-b border-[#333] flex justify-between items-center px-4 shrink-0 shadow-sm bg-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4.5 h-4.5 text-gray-300" />
          <h2 className="font-semibold text-[16px]">Settings</h2>
        </div>
        <button onClick={onClose} className="p-1.5 active:bg-[#333] hover:bg-[#2a2a2a] rounded-full transition-colors shrink-0 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-safe">
        <div className="max-w-xl mx-auto space-y-6 w-full">
          {/* Theme */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-300">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleChange('theme', theme.id)}
                  className={`px-3 py-1.5 rounded border text-[12px] text-center transition-colors ${
                    settings.theme === theme.id 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                      : 'border-[#444] text-gray-300 hover:bg-[#2a2a2a]'
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-medium text-gray-300">Editor Font Size ({settings.fontSize}px)</label>
            </div>
            <input 
              type="range" 
              min="10" 
              max="30" 
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
            />
          </div>

          {/* Font Family & Tab Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-[13px] font-medium text-gray-300">Font Family</label>
              <div className="relative">
                <select
                  value={settings.fontFamily || "'JetBrains Mono', monospace"}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-[#444] text-[12px] text-gray-200 rounded-lg p-2 pr-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                  <option value="'Fira Code', monospace">Fira Code</option>
                  <option value="monospace">System Mono</option>
                  <option value="'Courier New', Courier, monospace">Courier New</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2 relative">
              <label className="text-[13px] font-medium text-gray-300">Tab Size</label>
              <div className="relative">
                <select
                  value={settings.tabSize || 2}
                  onChange={(e) => handleChange('tabSize', parseInt(e.target.value))}
                  className="w-full bg-[#2a2a2a] border border-[#444] text-[12px] text-gray-200 rounded-lg p-2 pr-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces</option>
                  <option value={8}>8 Spaces</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-5 pt-1">
            {[
              { id: 'wordWrap', label: 'Word Wrap', value: settings.wordWrap ?? true },
              { id: 'lineNumbers', label: 'Line Numbers', value: settings.lineNumbers ?? true },
              { id: 'autoSave', label: 'Auto Save', value: settings.autoSave ?? true },
              { id: 'matchBrackets', label: 'Match Brackets', value: settings.matchBrackets ?? true },
              { id: 'autocomplete', label: 'Autocompletion', value: settings.autocomplete ?? true },
              { id: 'codeFolding', label: 'Code Folding', value: settings.codeFolding ?? true },
              { id: 'highlightActiveLine', label: 'Highlight Active Line', value: settings.highlightActiveLine ?? true },
            ].map(toggle => (
              <div key={toggle.id} className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-gray-300">{toggle.label}</span>
                <button
                  onClick={() => handleChange(toggle.id as keyof AppSettings, !toggle.value)}
                  className={`relative inline-flex h-5.5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    toggle.value ? 'bg-blue-500' : 'bg-[#444]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      toggle.value ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Export */}
          <div className="border-t border-[#333] pt-5 mt-4">
            <button 
              onClick={exportProject}
              className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] active:bg-[#444] text-gray-200 transition-colors border border-[#444] text-[13px] font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export Workspace as ZIP</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
