import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, ChevronDown, ChevronRight, Check, Play, Loader2, StopCircle } from 'lucide-react';
import { ArtifactViewer } from './ArtifactViewer';

interface CodeBlockProps {
  language: string;
  value: string;
}

// Global cache to persist collapse state across re-renders (e.g. during streaming)
const collapseCache = new Map<string, boolean>();

// Map common markdown language codes to Piston format
const pistonLanguageMap: Record<string, string> = {
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  python: 'python',
  py: 'python',
  rust: 'rust',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cplusplus: 'cpp',
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  php: 'php',
  ruby: 'ruby',
  rb: 'ruby',
  csharp: 'csharp',
  cs: 'csharp',
  swift: 'swift',
  kotlin: 'kotlin',
  kt: 'kotlin',
  scala: 'scala',
  perl: 'perl',
  pl: 'perl',
  lua: 'lua',
  r: 'r',
  haskell: 'haskell',
  hs: 'haskell',
  clojure: 'clojure',
  clj: 'clojure',
  elixir: 'elixir',
  exs: 'elixir',
  erlang: 'erlang',
  erl: 'erlang',
  dart: 'dart',
  ocaml: 'ocaml',
  ml: 'ocaml',
  fsharp: 'fsharp',
  fs: 'fsharp',
  pascal: 'pascal',
  pas: 'pascal',
  nim: 'nim',
  brainfuck: 'brainfuck',
  bf: 'brainfuck',
  cobol: 'cobol',
  cbl: 'cobol',
  fortran: 'fortran',
  f90: 'fortran',
  awk: 'awk',
  groovy: 'groovy',
  zig: 'zig',
  crystal: 'crystal',
  cr: 'crystal',
  v: 'v',
  vlang: 'v',
  julia: 'julia',
  jl: 'julia',
};

// Also fetch dynamic list of piston languages and their aliases globally to guarantee 100% full support
let dynamicPistonLanguages = new Set<string>();
fetch('https://emkc.org/api/v2/piston/runtimes')
  .then(res => res.json())
  .then((data: any[]) => {
    data.forEach(runtime => {
      dynamicPistonLanguages.add(runtime.language.toLowerCase());
      runtime.aliases?.forEach((alias: string) => dynamicPistonLanguages.add(alias.toLowerCase()));
    });
  })
  .catch(console.error);


export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  // Use a hash of the content as the key for persistence
  const contentKey = React.useMemo(() => {
    let hash = 0;
    const str = value.trim();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `${language}-${hash}`;
  }, [value, language]);

  const [isCollapsed, setIsCollapsed] = useState(() => collapseCache.get(contentKey) ?? false);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<{ stdout: string, stderr: string, code: number | null }>({ stdout: '', stderr: '', code: null });
  const [showOutput, setShowOutput] = useState(false);

  const isHtml = language === 'html' || language === 'xml' || language === 'svg';
  const isDiagram = language === 'mermaid';
  // We can render HTML, Diagrams, or JS output directly using ArtifactViewer
  if (isHtml || isDiagram) {
      return <ArtifactViewer code={value} language={language} />;
  }

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    collapseCache.set(contentKey, newState);
  };

  const normalizedLang = language.toLowerCase();
  const pistonLang = pistonLanguageMap[normalizedLang] || (dynamicPistonLanguages.has(normalizedLang) ? normalizedLang : '');
  const isExecutable = !!pistonLang;

  const handleRun = async () => {
    if (!isExecutable || isRunning) return;
    setIsRunning(true);
    setShowOutput(true);
    setExecutionOutput({ stdout: 'Executing...', stderr: '', code: null });

    try {
      // Piston execute API v2
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: pistonLang,
          version: '*', // Uses the latest available version
          files: [
            {
              content: value
            }
          ]
        })
      });

      const data = await response.json();
      if (data.run) {
        setExecutionOutput({
          stdout: data.run.stdout,
          stderr: data.run.stderr,
          code: data.run.code
        });
      } else if (data.message) {
        setExecutionOutput({ stdout: '', stderr: data.message, code: 1 });
      } else {
        setExecutionOutput({ stdout: '', stderr: 'Unknown execution error occurred', code: 1 });
      }
    } catch (error: any) {
      setExecutionOutput({ stdout: '', stderr: error.message || 'Execution failed', code: 1 });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'markdown': 'md',
      'rust': 'rs',
      'go': 'go',
      'c': 'c',
      'cpp': 'cpp',
      'sql': 'sql',
      'bash': 'sh',
      'shell': 'sh'
    };
    
    const ext = extensions[language.toLowerCase()] || 'txt';
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-6 rounded-xl border border-[var(--surface-border)] overflow-hidden bg-[#1e1e1e] shadow-lg group/code">
      <div className="sticky top-0 z-20 flex items-center justify-between px-3 h-10 bg-[#252526] border-b border-[#333] text-[11px] md:text-xs text-gray-400 font-mono">
        <div className="flex items-center gap-2">
           <button 
             onClick={toggleCollapse}
             className="p-1 hover:bg-white/10 rounded-md transition-colors flex items-center justify-center"
           >
             {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
           </button>
           <span className="uppercase font-semibold tracking-wider">{language || 'code'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isExecutable && (
             <button
               onClick={handleRun}
               disabled={isRunning}
               className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-all active:scale-95 text-[var(--accent)]"
               title="Run Code"
             >
               {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
               <span className="hidden sm:inline">{isRunning ? 'Running' : 'Run'}</span>
             </button>
          )}
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-all active:scale-95 ${copied ? 'text-[var(--accent)] bg-[var(--accent)]/10' : ''}`}
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-all active:scale-95"
            title="Download code"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="relative overflow-x-auto text-[13px] md:text-[14px] leading-relaxed no-scrollbar bg-[#1e1e1e]">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers={true}
            lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#858585', textAlign: 'right', userSelect: 'none' }}
            customStyle={{
              margin: 0,
              padding: '1.25rem 0',
              background: 'transparent',
              fontSize: 'inherit',
              lineHeight: 'inherit',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'var(--font-mono)',
              }
            }}
          >
            {value.trim()}
          </SyntaxHighlighter>
          
          {showOutput && (
            <div className="border-t border-[#333] bg-[#1e1e1e]">
              <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#333]">
                <span className="text-xs font-semibold text-gray-400 tracking-wider">OUTPUT</span>
                <button 
                  onClick={() => setShowOutput(false)}
                  className="text-gray-500 hover:text-white"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 font-mono text-[13px] whitespace-pre-wrap max-h-60 overflow-y-auto">
                {executionOutput.stdout && <div className="text-gray-300">{executionOutput.stdout}</div>}
                {executionOutput.stderr && <div className="text-red-400 mt-1">{executionOutput.stderr}</div>}
                {executionOutput.code !== null && executionOutput.code !== 0 && (
                   <div className="text-red-400 mt-2 opacity-80 text-xs">Exited with code {executionOutput.code}</div>
                )}
                {!executionOutput.stdout && !executionOutput.stderr && executionOutput.code === 0 && (
                   <div className="text-[var(--accent)] opacity-80 text-xs text-italic">Execution finished with no output.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
