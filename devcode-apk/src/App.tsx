import React, { useState, useEffect, useRef } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { sass } from '@codemirror/lang-sass';
import { less } from '@codemirror/lang-less';
import { go } from '@codemirror/lang-go';
import { vue } from '@codemirror/lang-vue';
import { angular } from '@codemirror/lang-angular';
import { liquid } from '@codemirror/lang-liquid';
import { expandAbbreviation, abbreviationTracker } from '@emmetio/codemirror6-plugin';
import { linter, lintGutter } from '@codemirror/lint';
import { StreamLanguage } from '@codemirror/language';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { perl } from '@codemirror/legacy-modes/mode/perl';
import { swift } from '@codemirror/legacy-modes/mode/swift';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { erlang } from '@codemirror/legacy-modes/mode/erlang';
import { haskell } from '@codemirror/legacy-modes/mode/haskell';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { tcl } from '@codemirror/legacy-modes/mode/tcl';
import { toml } from '@codemirror/legacy-modes/mode/toml';
import { pug } from '@codemirror/legacy-modes/mode/pug';
import { clojure } from '@codemirror/legacy-modes/mode/clojure';
import { groovy } from '@codemirror/legacy-modes/mode/groovy';
import { haxe } from '@codemirror/legacy-modes/mode/haxe';
import { scala, kotlin } from '@codemirror/legacy-modes/mode/clike';

// Plugins
import prettier from 'js-beautify';

// Themes
import { oneDark } from '@codemirror/theme-one-dark';
import { githubLight } from '@uiw/codemirror-theme-github';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { monokai } from '@uiw/codemirror-theme-monokai';

import { undo, redo } from '@codemirror/commands';
import { openSearchPanel } from '@codemirror/search';
import { toggleComment } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';

import { AnimatePresence, motion } from 'motion/react';
import { AppBar } from './components/AppBar';
import { FileDrawer } from './components/FileDrawer';
import { QuickBar } from './components/QuickBar';
import { PreviewModal } from './components/PreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { TabBar } from './components/TabBar';
import { QuickOpenModal } from './components/QuickOpenModal';
import { FindInFilesModal } from './components/FindInFilesModal';
import { CustomDialog } from './components/CustomDialog';
import { StatusBar } from './components/StatusBar';
import { useDialog } from './hooks/useDialog';
import { INITIAL_FILES, FileNode, Language, AppSettings, DEFAULT_SETTINGS } from './types';

export default function App() {
  const [files, setFiles] = useState<FileNode[]>(() => {
    const saved = localStorage.getItem('acode-clone-files');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_FILES; }
    }
    return INITIAL_FILES;
  });

  const [openFileIds, setOpenFileIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('acode-clone-open-files');
    if (saved) { try { return JSON.parse(saved); } catch(e){} }
    return files.length > 0 ? [files[0].id] : [];
  });

  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    const saved = localStorage.getItem('acode-clone-active-file');
    return saved || (openFileIds.length > 0 ? openFileIds[0] : null);
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('acode-clone-settings');
    if (saved) { 
      try { 
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; 
      } catch(e){} 
    }
    return DEFAULT_SETTINGS;
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [isFindInFilesOpen, setIsFindInFilesOpen] = useState(false);
  
  const { dialogConfig, showDialog } = useDialog();
  
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => {
    if (settings.autoSave) {
      localStorage.setItem('acode-clone-files', JSON.stringify(files));
    }
  }, [files, settings.autoSave]);

  useEffect(() => {
    const updateStatusBar = async () => {
      try {
        const { StatusBar: CapStatusBar } = await import('@capacitor/status-bar');
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const color = settings.theme === 'github' ? '#f0f0f0' : '#1e1e1e';
          await CapStatusBar.setBackgroundColor({ color });
        }
      } catch (e) {}
    };
    updateStatusBar();
    localStorage.setItem('acode-clone-open-files', JSON.stringify(openFileIds));
    if (activeFileId) localStorage.setItem('acode-clone-active-file', activeFileId);
    localStorage.setItem('acode-clone-settings', JSON.stringify(settings));
  }, [openFileIds, activeFileId, settings]);

  const handleManualSave = () => {
    localStorage.setItem('acode-clone-files', JSON.stringify(files));
    const icon = document.querySelector('.lucide-save');
    if (icon) {
      icon.classList.add('text-green-400');
      setTimeout(() => icon.classList.remove('text-green-400'), 500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files]);

  const activeFile = files.find(f => f.id === activeFileId);
  const openFiles = openFileIds.map(id => files.find(f => f.id === id)).filter(Boolean) as FileNode[];

  const handleEditorChange = (value: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: value } : f));
  };

  const editorExtensions = React.useMemo(() => {
    if (!activeFile) return [];
    
    const lang = activeFile.language;
    const exts: any[] = [lintGutter()];
    
    exts.push(linter((view) => {
      const diagnostics: any[] = [];
      const text = view.state.doc.toString();
      
      try {
        if (lang === 'json') {
          if (text.trim()) JSON.parse(text);
        } else if (['javascript', 'typescript', 'java', 'cpp', 'rust', 'go', 'kotlin', 'scala', 'dart', 'swift', 'css', 'sass', 'less'].includes(lang)) {
          // Advanced bracket and brace matching for C-style languages
          const stack: { char: string, pos: number, line: number }[] = [];
          const openers = ['(', '{', '['];
          const closers: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
          const pairMap: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
          
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (openers.includes(char)) {
              stack.push({ char, pos: i, line: view.state.doc.lineAt(i).number });
            } else if (closers[char]) {
              const expectedOpener = closers[char];
              if (stack.length === 0 || stack[stack.length - 1].char !== expectedOpener) {
                diagnostics.push({
                  from: i,
                  to: i + 1,
                  severity: 'error',
                  message: `Unexpected closing character: ${char}${stack.length > 0 ? ` (Expected ${pairMap[stack[stack.length - 1].char]})` : ''}`
                });
              } else {
                stack.pop();
              }
            }
          }
          
          for (const remaining of stack) {
            diagnostics.push({
              from: remaining.pos,
              to: remaining.pos + 1,
              severity: 'error',
              message: `Unclosed: ${remaining.char}`
            });
          }
        } else if (lang === 'ruby' || lang === 'lua' || lang === 'shell') {
          // Keyword balance (def/function/if ... end)
          const stack: { word: string, pos: number }[] = [];
          const lines = text.split('\n');
          let currentPos = 0;
          
          lines.forEach((line) => {
            const trimmed = line.trim();
            // Start keywords
            if (trimmed.match(/^(def|class|module|if|do|unless|while|until|case|for|function)\b/)) {
              if (!trimmed.match(/\bend\b/)) { // simple one-liner check
                stack.push({ word: 'start', pos: currentPos });
              }
            }
            // End keyword
            if (trimmed === 'end' || trimmed.startsWith('end #') || trimmed.match(/^end\b/)) {
              if (stack.length === 0) {
                diagnostics.push({
                  from: currentPos,
                  to: currentPos + trimmed.length,
                  severity: 'error',
                  message: 'Unexpected "end" keyword'
                });
              } else {
                stack.pop();
              }
            }
            currentPos += line.length + 1;
          });
          
          stack.forEach(rem => {
            diagnostics.push({
              from: rem.pos,
              to: rem.pos + 5,
              severity: 'error',
              message: 'Missing "end" for this block'
            });
          });
        } else if (lang === 'python') {
          // Check for colon after def/if/else/for/while/class
          const lines = text.split('\n');
          let currentPos = 0;
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.match(/^(def|if|else|elif|for|while|class|try|except|finally|with)\b/) && !trimmed.endsWith(':') && !trimmed.includes(': #')) {
              diagnostics.push({
                from: currentPos + line.indexOf(trimmed),
                to: currentPos + line.length,
                severity: 'error',
                message: 'Expected ":" at end of control flow statement'
              });
            }
            currentPos += line.length + 1;
          });
        } else if (lang === 'html' || lang === 'xml' || lang === 'vue' || lang === 'angular' || lang === 'liquid') {
          // Tag mismatch detection
          const tagStack: { name: string, pos: number }[] = [];
          const tagRegex = /<(\/?[a-zA-Z0-9\-]+)([^>]*)>/g;
          let match;
          
          while ((match = tagRegex.exec(text)) !== null) {
            const fullTag = match[0];
            const tagName = match[1];
            const startPos = match.index;
            
            // Skip comments and doctype
            if (fullTag.startsWith('<!--') || fullTag.startsWith('<!')) continue;
            
            if (tagName.startsWith('/')) {
              const name = tagName.slice(1);
              if (tagStack.length === 0) {
                diagnostics.push({
                  from: startPos,
                  to: startPos + fullTag.length,
                  severity: 'error',
                  message: `Closing tag </${name}> without opener`
                });
              } else if (tagStack[tagStack.length - 1].name !== name) {
                // Check if it's a void element or something we missed
                const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
                if (!voidElements.includes(tagStack[tagStack.length - 1].name.toLowerCase())) {
                  diagnostics.push({
                    from: startPos,
                    to: startPos + fullTag.length,
                    severity: 'error',
                    message: `Tag mismatch: expected </${tagStack[tagStack.length - 1].name}>, found </${name}>`
                  });
                }
              } else {
                tagStack.pop();
              }
            } else {
              const isSelfClosing = fullTag.endsWith('/>');
              const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
              if (!voidElements.includes(tagName.toLowerCase()) && !isSelfClosing) {
                tagStack.push({ name: tagName, pos: startPos });
              }
            }
          }
          
          for (const remaining of tagStack) {
            diagnostics.push({
              from: remaining.pos,
              to: remaining.pos + remaining.name.length + 1,
              severity: 'error',
              message: `Unclosed tag: <${remaining.name}>`
            });
          }
        }
      } catch (e: any) {
        if (lang === 'json') {
          const match = e.message.match(/at position (\d+)/) || e.message.match(/char (\d+)/);
          const pos = match ? parseInt(match[1]) : 0;
          diagnostics.push({
            from: Math.max(0, pos - 1),
            to: Math.min(text.length, pos + 1),
            severity: 'error',
            message: e.message
          });
        }
      }
      
      return diagnostics;
    }));

    switch (lang) {
      case 'javascript': exts.push(javascript({ jsx: true })); break;
      case 'html': exts.push(html(), abbreviationTracker()); break;
      case 'css': exts.push(css(), abbreviationTracker()); break;
      case 'json': exts.push(json()); break;
      case 'markdown': exts.push(markdown()); break;
      case 'php': exts.push(php()); break;
      case 'python': exts.push(python()); break;
      case 'cpp': exts.push(cpp()); break;
      case 'java': exts.push(java()); break;
      case 'rust': exts.push(rust()); break;
      case 'sql': exts.push(sql()); break;
      case 'xml': exts.push(xml()); break;
      case 'yaml': exts.push(yaml()); break;
      case 'sass': exts.push(sass()); break;
      case 'less': exts.push(less()); break;
      case 'go': exts.push(go()); break;
      case 'vue': exts.push(vue()); break;
      case 'angular': exts.push(angular()); break;
      case 'liquid': exts.push(liquid()); break;
      case 'ruby': exts.push(StreamLanguage.define(ruby)); break;
      case 'perl': exts.push(StreamLanguage.define(perl)); break;
      case 'swift': exts.push(StreamLanguage.define(swift)); break;
      case 'kotlin': exts.push(StreamLanguage.define(kotlin)); break;
      case 'scala': exts.push(StreamLanguage.define(scala)); break;
      case 'dart':
        // Fallback to kotlin mode for dart if dart isn't directly available
        exts.push(StreamLanguage.define(kotlin)); break;
      case 'shell': exts.push(StreamLanguage.define(shell)); break;
      case 'erlang': exts.push(StreamLanguage.define(erlang)); break;
      case 'haskell': exts.push(StreamLanguage.define(haskell)); break;
      case 'lua': exts.push(StreamLanguage.define(lua)); break;
      case 'tcl': exts.push(StreamLanguage.define(tcl)); break;
      case 'toml': exts.push(StreamLanguage.define(toml)); break;
      case 'pug': exts.push(StreamLanguage.define(pug)); break;
      case 'clojure': exts.push(StreamLanguage.define(clojure)); break;
      case 'groovy': exts.push(StreamLanguage.define(groovy)); break;
      case 'haxe': exts.push(StreamLanguage.define(haxe)); break;
      case 'typescript': exts.push(javascript({ jsx: true, typescript: true })); break;
    }

    if (settings.wordWrap) exts.push(EditorView.lineWrapping);

    return exts;
  }, [activeFile?.id, activeFile?.language, settings.wordWrap]);

  const getThemeExtension = () => {
    switch (settings.theme) {
      case 'github': return githubLight;
      case 'vscode': return vscodeDark;
      case 'dracula': return dracula;
      case 'tokyonight': return tokyoNight;
      case 'monokai': return monokai;
      default: return oneDark;
    }
  };

  const handleNewFile = async (parentId: string | null = null) => {
    const fileName = await showDialog({
      type: 'prompt',
      title: 'New File',
      message: 'Enter file name:'
    }) as string;
    if (!fileName) return;

    let lang: Language = 'text';
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.js') || lowerName.endsWith('.cjs') || lowerName.endsWith('.mjs')) lang = 'javascript';
    else if (lowerName.endsWith('.ts') || lowerName.endsWith('.cts') || lowerName.endsWith('.mts')) lang = 'typescript';
    else if (lowerName.endsWith('.jsx') || lowerName.endsWith('.tsx')) lang = 'javascript'; // CM handles JSX in JS/TS
    else if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) lang = 'html';
    else if (lowerName.endsWith('.css')) lang = 'css';
    else if (lowerName.endsWith('.json')) lang = 'json';
    else if (lowerName.endsWith('.md')) lang = 'markdown';
    else if (lowerName.endsWith('.php') || lowerName.endsWith('.phtml')) lang = 'php';
    else if (lowerName.endsWith('.py')) lang = 'python';
    else if (lowerName.endsWith('.cpp') || lowerName.endsWith('.hpp') || lowerName.endsWith('.cc') || lowerName.endsWith('.h')) lang = 'cpp';
    else if (lowerName.endsWith('.java')) lang = 'java';
    else if (lowerName.endsWith('.rs')) lang = 'rust';
    else if (lowerName.endsWith('.sql')) lang = 'sql';
    else if (lowerName.endsWith('.xml') || lowerName.endsWith('.svg')) lang = 'xml';
    else if (lowerName.endsWith('.yaml') || lowerName.endsWith('.yml')) lang = 'yaml';
    else if (lowerName.endsWith('.sass')) lang = 'sass';
    else if (lowerName.endsWith('.scss')) lang = 'sass';
    else if (lowerName.endsWith('.less')) lang = 'less';
    else if (lowerName.endsWith('.go')) lang = 'go';
    else if (lowerName.endsWith('.rb')) lang = 'ruby';
    else if (lowerName.endsWith('.pl')) lang = 'perl';
    else if (lowerName.endsWith('.swift')) lang = 'swift';
    else if (lowerName.endsWith('.kt')) lang = 'kotlin';
    else if (lowerName.endsWith('.scala')) lang = 'scala';
    else if (lowerName.endsWith('.sh') || lowerName.endsWith('.bash')) lang = 'shell';
    else if (lowerName.endsWith('.dart')) lang = 'dart';
    else if (lowerName.endsWith('.erl')) lang = 'erlang';
    else if (lowerName.endsWith('.hs')) lang = 'haskell';
    else if (lowerName.endsWith('.lua')) lang = 'lua';
    else if (lowerName.endsWith('.tcl')) lang = 'tcl';
    else if (lowerName.endsWith('.toml')) lang = 'toml';
    else if (lowerName.endsWith('.pug')) lang = 'pug';
    else if (lowerName.endsWith('.clojure') || lowerName.endsWith('.clj')) lang = 'clojure';
    else if (lowerName.endsWith('.vue')) lang = 'vue';
    else if (lowerName.endsWith('.groovy')) lang = 'groovy';
    else if (lowerName.endsWith('.hx')) lang = 'haxe';
    else if (lowerName.endsWith('.graphql') || lowerName.endsWith('.gql')) lang = 'graphql';

    const newFile: FileNode = {
      id: Date.now().toString(),
      name: fileName,
      language: lang,
      type: 'file',
      parentId: parentId,
      content: ''
    };

    setFiles([...files, newFile]);
    setOpenFileIds([...openFileIds, newFile.id]);
    setActiveFileId(newFile.id);
    setIsDrawerOpen(false);
  };

  const handleNewFolder = async (parentId: string | null = null) => {
    const folderName = await showDialog({
      type: 'prompt',
      title: 'New Folder',
      message: 'Enter folder name:'
    }) as string;
    if (!folderName) return;

    const newFolder: FileNode = {
      id: Date.now().toString(),
      name: folderName,
      language: 'text',
      type: 'folder',
      parentId: parentId,
      isOpen: true
    };

    setFiles([...files, newFolder]);
  };

  const handleDeleteFile = async (id: string) => {
    const isConfirmed = await showDialog({
      type: 'confirm',
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item and all its contents?'
    });
    if (isConfirmed) {
      const idsToDelete = new Set<string>();
      const collectIds = (targetId: string) => {
        idsToDelete.add(targetId);
        files.filter(f => f.parentId === targetId).forEach(f => collectIds(f.id));
      };
      collectIds(id);

      const newFiles = files.filter(f => !idsToDelete.has(f.id));
      setFiles(newFiles);
      
      const newOpenFiles = openFileIds.filter(fid => !idsToDelete.has(fid));
      setOpenFileIds(newOpenFiles);
      if (activeFileId && idsToDelete.has(activeFileId)) {
        setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
      }
    }
  };

  const handleFileSelect = (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file || file.type === 'folder') return;
    
    if (!openFileIds.includes(id)) {
      setOpenFileIds([...openFileIds, id]);
    }
    setActiveFileId(id);
    setIsDrawerOpen(false);
  };

  const handleToggleFolder = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  const handleTabClose = (id: string) => {
    const newOpenFiles = openFileIds.filter(fid => fid !== id);
    setOpenFileIds(newOpenFiles);
    if (activeFileId === id) {
      setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

  const insertText = (text: string) => {
    const view = editorRef.current?.view;
    if (view) {
      const { state } = view;
      const selection = state.selection.main;
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: { anchor: selection.from + text.length },
        scrollIntoView: true,
      });
      view.focus();
    }
  };

  const handleSearch = () => {
    if (editorRef.current?.view) openSearchPanel(editorRef.current.view);
  };

  const handleUndo = () => {
    if (editorRef.current?.view) undo(editorRef.current.view);
  };

  const handleRedo = () => {
    if (editorRef.current?.view) redo(editorRef.current.view);
  };
  
  const handleToggleComment = () => {
    if (editorRef.current?.view) toggleComment(editorRef.current.view);
  };

  const handleExpandEmmet = () => {
    if (editorRef.current?.view) expandAbbreviation(editorRef.current.view);
  };

  const handleFormat = () => {
    if (!activeFile) return;
    
    let formatted = activeFile.content;
    const opts = { indent_size: settings.tabSize };
    
    try {
      if (activeFile.language === 'json') {
        formatted = JSON.stringify(JSON.parse(activeFile.content), null, settings.tabSize);
      } else if (activeFile.language === 'javascript') {
        formatted = prettier.js(activeFile.content, opts);
      } else if (activeFile.language === 'html' || activeFile.language === 'markdown') {
        formatted = prettier.html(activeFile.content, opts);
      } else if (activeFile.language === 'css') {
        formatted = prettier.css(activeFile.content, opts);
      }
      
      const view = editorRef.current?.view;
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: formatted }
        });
      } else {
        handleEditorChange(formatted);
      }
    } catch (e) {
      showDialog({
        type: 'alert',
        title: 'Format Error',
        message: 'Invalid code or format error'
      });
    }
  };

  const handleRenameFile = async (id: string) => {
    const fileToRename = files.find(f => f.id === id);
    if (!fileToRename) return;
    
    const newName = await showDialog({
      type: 'prompt',
      title: 'Rename File',
      message: 'Enter new file name:',
      defaultValue: fileToRename.name
    }) as string;
    
    if (!newName || newName === fileToRename.name) return;
    
    let lang = fileToRename.language;
    const lowerNewName = newName.toLowerCase();
    if (lowerNewName.endsWith('.js') || lowerNewName.endsWith('.cjs') || lowerNewName.endsWith('.mjs')) lang = 'javascript';
    else if (lowerNewName.endsWith('.ts') || lowerNewName.endsWith('.cts') || lowerNewName.endsWith('.mts')) lang = 'typescript';
    else if (lowerNewName.endsWith('.jsx') || lowerNewName.endsWith('.tsx')) lang = 'javascript';
    else if (lowerNewName.endsWith('.html') || lowerNewName.endsWith('.htm')) lang = 'html';
    else if (lowerNewName.endsWith('.css')) lang = 'css';
    else if (lowerNewName.endsWith('.json')) lang = 'json';
    else if (lowerNewName.endsWith('.md')) lang = 'markdown';
    else if (lowerNewName.endsWith('.php') || lowerNewName.endsWith('.phtml')) lang = 'php';
    else if (lowerNewName.endsWith('.py')) lang = 'python';
    else if (lowerNewName.endsWith('.cpp') || lowerNewName.endsWith('.hpp') || lowerNewName.endsWith('.cc') || lowerNewName.endsWith('.h')) lang = 'cpp';
    else if (lowerNewName.endsWith('.java')) lang = 'java';
    else if (lowerNewName.endsWith('.rs')) lang = 'rust';
    else if (lowerNewName.endsWith('.sql')) lang = 'sql';
    else if (lowerNewName.endsWith('.xml') || lowerNewName.endsWith('.svg')) lang = 'xml';
    else if (lowerNewName.endsWith('.yaml') || lowerNewName.endsWith('.yml')) lang = 'yaml';
    else if (lowerNewName.endsWith('.sass')) lang = 'sass';
    else if (lowerNewName.endsWith('.scss')) lang = 'sass';
    else if (lowerNewName.endsWith('.less')) lang = 'less';
    else if (lowerNewName.endsWith('.go')) lang = 'go';
    else if (lowerNewName.endsWith('.rb')) lang = 'ruby';
    else if (lowerNewName.endsWith('.pl')) lang = 'perl';
    else if (lowerNewName.endsWith('.swift')) lang = 'swift';
    else if (lowerNewName.endsWith('.kt')) lang = 'kotlin';
    else if (lowerNewName.endsWith('.scala')) lang = 'scala';
    else if (lowerNewName.endsWith('.sh') || lowerNewName.endsWith('.bash')) lang = 'shell';
    else if (lowerNewName.endsWith('.dart')) lang = 'dart';
    else if (lowerNewName.endsWith('.erl')) lang = 'erlang';
    else if (lowerNewName.endsWith('.hs')) lang = 'haskell';
    else if (lowerNewName.endsWith('.lua')) lang = 'lua';
    else if (lowerNewName.endsWith('.tcl')) lang = 'tcl';
    else if (lowerNewName.endsWith('.toml')) lang = 'toml';
    else if (lowerNewName.endsWith('.pug')) lang = 'pug';
    else if (lowerNewName.endsWith('.clojure') || lowerNewName.endsWith('.clj')) lang = 'clojure';
    else if (lowerNewName.endsWith('.vue')) lang = 'vue';
    else if (lowerNewName.endsWith('.groovy')) lang = 'groovy';
    else if (lowerNewName.endsWith('.hx')) lang = 'haxe';
    else if (lowerNewName.endsWith('.graphql') || lowerNewName.endsWith('.gql')) lang = 'graphql';
    
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName, language: lang } : f));
  };

  const handleDownloadFile = async (id: string) => {
    const fileToDownload = files.find(f => f.id === id);
    if (!fileToDownload) return;
    
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const directory = Directory.ExternalStorage;
        const filePath = `Download/${fileToDownload.name}`;
        
        await Filesystem.writeFile({
          path: filePath,
          data: fileToDownload.content,
          directory: directory,
        });
        showDialog({ type: 'alert', title: 'Saved', message: `File saved successfully` });
        return;
      }
    } catch (e) {
      console.warn('Capacitor save failed, falling back to blob', e);
    }

    const blob = new Blob([fileToDownload.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileToDownload.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDuplicateFile = (id: string) => {
    const fileToDuplicate = files.find(f => f.id === id);
    if (!fileToDuplicate) return;

    let newName = fileToDuplicate.name;
    const match = newName.match(/^(.*?)(\.[^.]+)?$/);
    if (match) {
      newName = `${match[1]}-copy${match[2] || ''}`;
    }

    const newFile: FileNode = {
      id: Date.now().toString(),
      name: newName,
      language: fileToDuplicate.language,
      type: 'file',
      parentId: fileToDuplicate.parentId,
      content: fileToDuplicate.content
    };

    setFiles([...files, newFile]);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const newFiles: FileNode[] = [];
    const readPromises = Array.from(uploadedFiles).map((file) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          let lang: Language = 'text';
          const lowerFileName = file.name.toLowerCase();
          if (lowerFileName.endsWith('.js') || lowerFileName.endsWith('.ts')) lang = 'javascript';
          else if (lowerFileName.endsWith('.html')) lang = 'html';
          else if (lowerFileName.endsWith('.css')) lang = 'css';
          else if (lowerFileName.endsWith('.json')) lang = 'json';
          else if (lowerFileName.endsWith('.md')) lang = 'markdown';

          newFiles.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            language: lang,
            type: 'file',
            parentId: null,
            content: event.target?.result as string || ''
          });
          resolve();
        };
        reader.readAsText(file);
      });
    });

    Promise.all(readPromises).then(() => {
      setFiles(prev => [...prev, ...newFiles]);
      // Reset input
      e.target.value = '';
    });
  };

  const handleExportWorkspace = async () => {
    if (files.length === 0) return;
    
    // Dynamically import jszip and file-saver
    const JSZip = (await import('jszip')).default;
    const { saveAs } = await import('file-saver');

    const zip = new JSZip();
    
    files.forEach(file => {
      zip.file(file.name, file.content);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const directory = Directory.ExternalStorage;
        const filePath = `Download/workspace.zip`;
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(content);
        });
        
        await Filesystem.writeFile({
          path: filePath,
          data: base64Data,
          directory: directory,
        });
        showDialog({ type: 'alert', title: 'Exported', message: `Workspace saved successfully` });
        return;
      }
    } catch (e) {
      console.warn('Capacitor save failed, falling back to blob', e);
    }
    
    saveAs(content, 'workspace.zip');
  };

  const isLightMode = settings.theme === 'github';

  const isPreviewable = activeFile !== undefined && (
    activeFile.name.toLowerCase().endsWith('.html') || 
    activeFile.name.toLowerCase().endsWith('.htm') ||
    activeFile.name.toLowerCase().endsWith('.js') || 
    activeFile.name.toLowerCase().endsWith('.css') || 
    activeFile.name.toLowerCase().endsWith('.md') ||
    activeFile.name.toLowerCase().endsWith('.ts') ||
    activeFile.name.toLowerCase().endsWith('.jsx') ||
    activeFile.name.toLowerCase().endsWith('.tsx')
  );

  return (
    <div 
      className={`flex flex-col h-[100dvh] w-full ${isLightMode ? 'bg-[#f0f0f0]' : 'bg-[#1e1e1e]'} overflow-hidden fixed inset-0 shadow-inner`}
      style={{ fontFamily: settings.fontFamily }}
    >
      <AppBar 
        title={activeFile?.name || 'DEV-CODE'} 
        onMenuClick={() => setIsDrawerOpen(true)}
        onSearchClick={() => setIsQuickOpen(true)}
        onFindInFilesClick={() => setIsFindInFilesOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onPlayClick={() => setIsPreviewOpen(true)}
        onSaveClick={handleManualSave}
        showPreview={isPreviewable}
      />

      <TabBar 
        openFiles={openFiles}
        activeFileId={activeFileId}
        onTabClick={setActiveFileId}
        onTabClose={handleTabClose}
      />
      
      <FileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        files={files}
        activeFileId={activeFileId}
        onFileSelect={handleFileSelect}
        onNewFile={handleNewFile}
        onNewFolder={handleNewFolder}
        onToggleFolder={handleToggleFolder}
        onDeleteFile={handleDeleteFile}
        onRenameFile={handleRenameFile}
        onDownloadFile={handleDownloadFile}
        onDuplicateFile={handleDuplicateFile}
        onUploadFile={handleUploadFile}
        onExportWorkspace={handleExportWorkspace}
      />

      <div className="flex-1 w-full relative overflow-hidden bg-inherit">
        {activeFile ? (
          <CodeMirror
            ref={editorRef}
            value={activeFile.content}
            height="100%"
            theme={getThemeExtension()}
            extensions={editorExtensions}
            onChange={handleEditorChange}
            className="h-full w-full"
            style={{ fontSize: `${settings.fontSize}px` }}
            basicSetup={{
              lineNumbers: settings.lineNumbers,
              highlightActiveLineGutter: settings.highlightActiveLine,
              foldGutter: settings.codeFolding,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: settings.matchBrackets,
              closeBrackets: settings.matchBrackets,
              autocompletion: settings.autocomplete,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: settings.highlightActiveLine,
              highlightSelectionMatches: true,
              closeBracketsKeymap: settings.matchBrackets,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: settings.codeFolding,
              completionKeymap: settings.autocomplete,
              lintKeymap: true,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-4">
            <p>No file selected</p>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow active:bg-blue-700"
            >
              Open Workspace
            </button>
          </div>
        )}
      </div>

      {activeFile && (
        <QuickBar 
          onInsert={insertText} 
          onUndo={handleUndo}
          onRedo={handleRedo}
          onFormat={handleFormat}
          onSearch={handleSearch}
          onToggleComment={handleToggleComment}
          onExpandEmmet={handleExpandEmmet}
        />
      )}
      
      <AnimatePresence>
        {isPreviewOpen && (
          <PreviewModal 
            files={files} 
            activeFile={activeFile}
            onClose={() => setIsPreviewOpen(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            settings={settings}
            onSettingsChange={setSettings}
            onClose={() => setIsSettingsOpen(false)}
            files={files}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isQuickOpen && (
          <QuickOpenModal
            files={files}
            onClose={() => setIsQuickOpen(false)}
            onSelect={handleFileSelect}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isFindInFilesOpen && (
          <FindInFilesModal
            isOpen={isFindInFilesOpen}
            onClose={() => setIsFindInFilesOpen(false)}
            files={files}
            onFileSelect={handleFileSelect}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {dialogConfig && (
          <CustomDialog
            isOpen={dialogConfig.isOpen}
            type={dialogConfig.type}
            title={dialogConfig.title}
            message={dialogConfig.message}
            defaultValue={dialogConfig.defaultValue}
            onConfirm={dialogConfig.onConfirm}
            onCancel={dialogConfig.onCancel}
          />
        )}
      </AnimatePresence>
      
      <StatusBar 
        activeFile={activeFile} 
        settings={settings} 
        onLanguageChange={(lang) => {
          if (!activeFileId) return;
          setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: lang } : f));
        }}
      />
      
      <style>{`
        .cm-editor { 
          height: 100%; 
          font-family: ${settings.fontFamily};
        }
        .cm-scroller { 
          font-family: ${settings.fontFamily}; 
          padding-bottom: 200px;
        }
        .cm-lineWrapping { 
          white-space: ${settings.wordWrap ? 'pre-wrap' : 'pre'} !important; 
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(128,128,128,0.3);
          border-radius: 4px;
        }
        /* Native app safe areas */
        .pt-safe { padding-top: env(safe-area-inset-top); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
}
