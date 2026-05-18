import React, { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw, X, Terminal, FileText } from 'lucide-react';
import { FileNode } from '../types';
import Markdown from 'react-markdown';

import { motion } from 'motion/react';

interface PreviewModalProps {
  files: FileNode[];
  activeFile?: FileNode;
  onClose: () => void;
}

export function PreviewModal({ files, activeFile, onClose }: PreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);
  const [logs, setLogs] = useState<{type: string, message: string}[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [mode, setMode] = useState<'html' | 'markdown'>(activeFile?.language === 'markdown' ? 'markdown' : 'html');

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'console') {
        setLogs(prev => [...prev, { type: e.data.logType, message: e.data.message }]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (mode === 'markdown') return;

    const updateIframe = () => {
      if (!iframeRef.current) return;
      
      let htmlFileContent = '<!DOCTYPE html>\\n<html lang="en">\\n<head>\\n<meta charset="UTF-8">\\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\\n<title>Preview</title>\\n</head>\\n<body>\\n<div id="root"></div>\\n<div id="app"></div>\\n</body>\\n</html>';
      
      if (activeFile && activeFile.name.toLowerCase().endsWith('.html')) {
        htmlFileContent = activeFile.content;
      } else {
        const indexHtml = files.find(f => f.name.toLowerCase() === 'index.html');
        if (indexHtml) {
          htmlFileContent = indexHtml.content;
        } else {
          const anyHtml = files.find(f => f.name.toLowerCase().endsWith('.html'));
          if (anyHtml) {
            htmlFileContent = anyHtml.content;
          }
        }
      }
      
      const cssFiles = files.filter(f => f.language === 'css').map(f => f.content).join('\\n');
      const jsFiles = files.filter(f => f.language === 'javascript').map(f => f.content).join('\\n');

      const consoleScript = `
        <script>
          (function() {
            const originalConsole = window.console;
            window.console = {
              ...originalConsole,
              log: function(...args) {
                originalConsole.log(...args);
                window.parent.postMessage({ type: 'console', logType: 'log', message: args.join(' ') }, '*');
              },
              error: function(...args) {
                originalConsole.error(...args);
                window.parent.postMessage({ type: 'console', logType: 'error', message: args.join(' ') }, '*');
              },
              warn: function(...args) {
                originalConsole.warn(...args);
                window.parent.postMessage({ type: 'console', logType: 'warn', message: args.join(' ') }, '*');
              }
            };
            window.onerror = function(message, source, lineno, colno, error) {
              window.parent.postMessage({ type: 'console', logType: 'error', message: message + ' at ' + lineno + ':' + colno }, '*');
            };
          })();
        </script>
      `;

      let docContent = htmlFileContent;
      if (docContent.includes('<head>')) {
        docContent = docContent.replace('<head>', `<head>${consoleScript}`);
      } else {
        docContent = consoleScript + docContent;
      }
      
      if (docContent.includes('</head>')) {
        docContent = docContent.replace('</head>', `<style>${cssFiles}</style></head>`);
      } else {
        docContent = `<style>${cssFiles}</style>` + docContent;
      }

      if (docContent.includes('</body>')) {
        docContent = docContent.replace('</body>', `<script>${jsFiles}</script></body>`);
      } else {
        docContent += `<script>${jsFiles}</script>`;
      }

      const blob = new Blob([docContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      iframeRef.current.src = url;

      return () => URL.revokeObjectURL(url);
    };
    
    setLogs([]);
    const cleanup = updateIframe();
    return () => { if(cleanup) cleanup(); };
  }, [files, key, mode]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-[#f0f0f0] z-50 flex flex-col items-center pt-safe"
    >
      <div className="w-full bg-[#1e1e1e] h-12 flex items-center justify-between px-3 text-white shadow-md z-10 shrink-0">
        <div className="flex items-center gap-2">
          {mode === 'html' ? <Play className="w-4.5 h-4.5 text-green-400" /> : <FileText className="w-4.5 h-4.5 text-blue-400" />}
          <span className="font-semibold text-sm tracking-tight">{mode === 'html' ? 'Web Preview' : 'Markdown Preview'}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {activeFile?.language === 'markdown' && files.some(f => f.name.toLowerCase().endsWith('.html')) && (
            <button 
              onClick={() => setMode(mode === 'html' ? 'markdown' : 'html')}
              className="px-2.5 py-1 text-[12px] font-medium bg-[#333] hover:bg-[#444] rounded transition-colors"
            >
              Switch to {mode === 'html' ? 'Markdown' : 'HTML'}
            </button>
          )}
          {mode === 'html' && (
            <button 
              onClick={() => setShowConsole(!showConsole)}
              className={`p-1.5 rounded-full transition-colors ${showConsole ? 'bg-blue-500/20 text-blue-400' : 'active:bg-[#333] hover:bg-[#333]'}`}
              title="Toggle Console"
            >
              <Terminal className="w-4.5 h-4.5" />
            </button>
          )}
          <button 
            onClick={() => setKey(k => k + 1)}
            className="p-1.5 active:bg-[#333] hover:bg-[#333] rounded-full"
            title="Reload Preview"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 active:bg-[#333] hover:bg-[#333] rounded-full"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-white">
        {mode === 'html' ? (
          <>
            <iframe
              ref={iframeRef}
              className={`w-full border-0 transition-all duration-150 ${showConsole ? 'h-3/5' : 'h-full'}`}
              sandbox="allow-scripts allow-same-origin allow-modals"
              title="preview"
            />
            {showConsole && (
              <div className="h-2/5 w-full bg-[#1e1e1e] flex flex-col border-t border-[#333] overflow-hidden">
                <div className="flex justify-between items-center bg-[#252526] px-3 py-1.5 border-b border-[#333]">
                  <span className="text-xs font-semibold text-gray-300 uppercase">Console</span>
                  <button 
                    onClick={() => setLogs([])}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="p-2 overflow-y-auto flex-1 font-mono text-sm space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className={`pb-1 border-b border-[#333] ${
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'warn' ? 'text-yellow-400' : 'text-gray-300'
                    }`}>
                      {'>'} {log.message}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-gray-500 italic text-sm">Console is empty</div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full p-6 overflow-y-auto bg-white text-gray-900 markdown-body">
            <Markdown>{activeFile?.content || ''}</Markdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
