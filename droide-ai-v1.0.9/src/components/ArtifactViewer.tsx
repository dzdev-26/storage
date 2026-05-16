import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Code, Maximize2, Minimize2, RefreshCcw, Copy, Download, Check } from 'lucide-react';

interface ArtifactViewerProps {
  code: string;
  language: string;
}

// Global cache to persist view mode across re-renders (e.g. during streaming)
const viewModeCache = new Map<string, 'preview' | 'code'>();

export function ArtifactViewer({ code, language }: ArtifactViewerProps) {
  // Use a hash of the content to persist state
  const contentKey = useMemo(() => {
    let hash = 0;
    const str = (code + language).trim();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `artifact-${hash}`;
  }, [code, language]);

  const [viewMode, setViewMode] = useState<'preview' | 'code'>(() => viewModeCache.get(contentKey) || 'preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0); 
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const vibrate = (ms = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  };
  
  const isHtml = language === 'html' || language === 'xml' || language === 'svg';
  const isDiagram = language === 'mermaid';

  const canPreview = isHtml || isDiagram || language === 'javascript' || language === 'js';

  useEffect(() => {
    viewModeCache.set(contentKey, viewMode);
  }, [viewMode, contentKey]);

  if (!canPreview) return null;

  const generateSrcDoc = () => {
    if (isHtml) {
      if (code.includes('<html') || code.includes('<body')) return code;
      return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>body { margin: 0; padding: 0; overflow-x: hidden; }</style></head><body class="font-sans">${code}</body></html>`;
    }
    if (isDiagram) {
      return `<!DOCTYPE html><html><head><script type="module">import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs'; mermaid.initialize({startOnLoad:true, theme: 'base'});</script><style>body { background: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }</style></head><body><pre class="mermaid">${code}</pre></body></html>`;
    }
    if (language === 'javascript' || language === 'js') {
       return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>body { margin: 0; padding: 1rem; }</style></head><body><div id="root"></div><script>${code}</script></body></html>`;
    }
    return code;
  };

  const handleRefresh = () => {
    vibrate(60);
    setKey(k => k + 1);
  };

  const handleCopy = async () => {
    vibrate(40);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleDownload = () => {
    vibrate(40);
    const ext = language === 'mermaid' ? 'mmd' : (language === 'javascript' || language === 'js' ? 'js' : 'html');
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    vibrate(50);
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex flex-col border border-[var(--border-primary)] rounded-2xl overflow-hidden bg-[var(--surface)] my-4 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : 'shadow-lg'}`}>
      <div className="flex items-center justify-between px-4 h-12 bg-[var(--surface-hover)] border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[--bg-main] p-1 rounded-xl border border-[var(--surface-border)] shadow-sm">
            <button
               onClick={() => { vibrate(30); setViewMode('preview'); }}
               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'preview' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <Play className="w-3.5 h-3.5" /> Preview
            </button>
            <button
               onClick={() => { vibrate(30); setViewMode('code'); }}
               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'code' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <Code className="w-3.5 h-3.5" /> Code
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[var(--text-muted)]">
          <button onClick={handleCopy} className="p-2 hover:bg-[var(--surface-border)] rounded-xl transition-all" title="Copy Code">
            {copied ? <Check className="w-4 h-4 text-[var(--accent)]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleDownload} className="p-2 hover:bg-[var(--surface-border)] rounded-xl transition-all" title="Download">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleRefresh} className="p-2 hover:bg-[var(--surface-border)] rounded-xl transition-all" title="Reload">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-[var(--surface-border)] rounded-xl transition-all" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`relative bg-white ${isFullscreen ? 'flex-1' : 'h-[600px]'}`}>
        {viewMode === 'preview' ? (
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={generateSrcDoc()}
            className="w-full h-full border-none block"
            sandbox="allow-scripts"
            title="Artifact Preview"
          />
        ) : (
          <div className="w-full h-full overflow-auto bg-[#1e1e1e] p-4 text-[13px] font-mono text-gray-300 no-scrollbar">
             <pre className="m-0"><code className="block whitespace-pre-wrap">{code}</code></pre>
          </div>
        )}
      </div>
    </div>
  );
}

