import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Paperclip, Send, Settings as SettingsIcon, Trash2, Edit2, Copy, Share, Volume2, VolumeX, Square, RefreshCcw, Image as ImageIcon, Sparkles, X, Sun, Moon, Type, Code, Monitor, Mic, ChevronDown, ChevronRight, ChevronLeft, Check, Download, Loader2, AlertTriangle, FileText, Video, Music, Box, Archive, Info, Eye, Zap, ShieldCheck, Search, Folder as FolderIcon, BookMarked, FileJson, FileType, FileOutput, GitFork, Phone, Brain, Blocks, Bell, Link2, User, CreditCard, Shield, Activity, Database, Cpu, Globe, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './components/CodeBlock';
import { MemoryMenu } from './components/MemoryMenu';
import { SkillsMenu } from './components/SkillsMenu';
import { ChatHeader } from './components/chat/ChatHeader';
import { BrandLogo } from './components/chat/BrandLogo';
import { ChatInput } from './components/chat/ChatInput';
import { SettingsModal } from './components/modals/SettingsModal';
import { ModelSelector } from './components/modals/ModelSelector';
import { PromptLibraryModal } from './components/modals/PromptLibraryModal';
import { DeleteSessionModal } from './components/modals/DeleteSessionModal';
import { ConnectorsModal } from './components/modals/ConnectorsModal';
import { ArtifactViewer } from './components/ArtifactViewer';
import { streamChat, generateTitle, ChatHistoryItem, getModelMetadata, listModels, fetchCustomModelMetadata } from './services/gemini';
import { extractArchive } from './lib/archive';
import { jsPDF } from 'jspdf';
import { getFileIcon } from './lib/fileIconRegistry';
import { 
  AppSettings, 
  Session, 
  Message, 
  Prompt as SavedPrompt, 
  CustomModel, 
  ApiProvider 
} from './types';

// --- Feature 1: Local Storage Hook for persistent history ---
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Only merge if both are objects (and not arrays)
        if (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue)) {
          return { ...initialValue, ...parsed };
        }
        return parsed;
      }
      return initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      return valueToStore;
    });
  };

  // Sync to localStorage with debounce to prevent performance lag during streaming
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error('LocalStorage Save Error:', error);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timeout);
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

import { ScrollToBottomFAB } from './components/common/ScrollToBottomFAB';
import { MessageSkeleton, Skeleton } from './components/common/Skeleton';

// --- Thinking Indicator ---
const ThinkingIndicator = ({ startTime, activeTool }: { startTime?: number, activeTool?: string }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [startTime]);

  const Cursor = () => (
    <motion.div
      animate={{
        scaleY: [1, 1.5, 1],
        opacity: [0.3, 0.8, 0.3],
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="w-0.5 h-4 bg-blue-500 ml-1 rounded-full shrink-0"
      style={{ boxShadow: "0 0 12px 2px rgba(59, 130, 246, 0.6)" }}
    />
  );

  if (startTime) {
    return (
      <div className="flex items-center space-x-2 py-2 px-1">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <div className="flex items-center">
          <span className="text-blue-500 font-medium text-base">
            {activeTool ? `Using ${activeTool}...` : 'Working...'} {elapsed}s
          </span>
          <Cursor />
        </div>
      </div>
    );
  }

  const chars = "Thinking...".split("");

  return (
    <div className="flex items-center py-2 px-1">
      <div className="flex">
        {chars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ y: 0, opacity: 0.5 }}
            animate={{ 
              y: [0, -5, 0],
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
            className="text-[var(--accent)] font-medium text-base inline-block"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </div>
      <Cursor />
    </div>
  );
};

// --- Feature 2 & 15: Folders and local types ---
type Folder = {
  id: string;
  name: string;
  isOpen: boolean;
};

const DEFAULT_PROMPT = `You are DROIDE, an advanced AI Assistant with agentic access to this application. 

# CORE CAPABILITIES
1. **Artifacts**: You can generate interactive UI components, HTML pages, SVG illustrations, and Mermaid diagrams. To render an artifact, you must provide the code inside standard markdown blocks specifying the language (e.g. \`\`\`html, \`\`\`mermaid, \`\`\`svg). DO NOT add \`react\` or \`ts\` language blocks for artifacts, output standard HTML + Tailwind CSS.
2. **Code Execution**: Use the \`execute_code\` tool to run logic in Python, Node JS, Rust, Go, C++, etc. 
3. **Web Search**: You have the \`googleSearch\` tool to search the internet and find live data.
4. **Live Integrations**:
   - \`get_weather(lat, lon)\` for live weather.
   - \`search_places(query)\` for Maps & Places.
   - \`get_sports_data(league, query)\` for sports.
5. **Memory**: Use \`manage_memory\` to learn or forget facts about the user.
6. **File Output**: Use \`save_file\` to save markdown, txt, csv, or code files.
7. **Read URL**: Use \`read_url_content\` for deep research of URLs.

Always be direct, helpful, and use Markdown.`;

const PERSONAS = [
  { name: 'Droide', prompt: DEFAULT_PROMPT },
  { name: 'Coder', prompt: "You are an expert software engineer. Focus on clean, modular, and efficient code. Always provide explanations for your code choices." },
  { name: 'Writer', prompt: "You are a creative writer. Use evocative, engaging language. Focus on storytelling and tone." },
  { name: 'Tutor', prompt: "You are a patient math tutor. Explain concepts step-by-step, use simple analogies, and encourage the user to solve problems." }
];

const ADAPTIVE_THINKING_INSTRUCTION = `
### ADAPTIVE THINKING PROTOCOL ENABLED ###
You must now use your Adaptive Thinking cognitive ability. This means:
1. **Cognitive Flexibility**: Pivot your perspective if new data arrives. See problems from multiple angles.
2. **Proactive Adjustment**: Adjust your strategies to thrive within changing conversational or task contexts.
3. **Challenge Assumptions**: Question existing knowledge/beliefs. Avoid relying on outdated "maps" or routines.
4. **Reflective Processing**: Pause and review your logic to ensure innovative, flexible outcomes.

Before each response, internally verify if your current strategy is still the most effective. If not, adapt instantly.
`;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  systemPrompt: DEFAULT_PROMPT,
  geminiApiKey: '',
  selectedModelId: 'gemini-3-flash-preview',
  forceBengali: false,
  streamResponses: true,
  autoTts: false,
  adaptiveThinking: false,
  temperature: 0.7,
  topP: 0.95,
  customInstructions: '',
  userMemories: [],
  formattingPreferences: {
    proseStyle: 'detailed',
    listStyle: 'bullets',
    responseLength: 'medium'
  },
  writingStyle: '',
  notifications: {
    taskCompletion: true,
    scheduledJobs: true,
    soundEnabled: false,
    dispatchMessages: false
  },
  installedSkills: [],
  fullName: '/dzdev 20',
  avatarUrl: '',
  nickname: '/dzdev 20',
  workDescription: 'Other',
  chatFont: 'DROIDE Serif',
  chatFontSize: 15,
  voice: 'Female',
  locationMetadata: true,
  improveDroide: true,
  discoveryEnabled: true,
  generateMemory: false,
  toolAccessMode: 'needed',
  artifactsEnabled: true,
  aiArtifactsEnabled: false,
  inlineVisualizations: true,
  codeExecution: true,
  networkEgress: true,
  aiRequirements: []
};

const BUILT_IN_MODELS = [
  { 
    id: 'gemini-3.1-pro-preview', 
    displayName: 'Gemini 3.1 Pro Preview', 
    providerId: 'google',
    caps: { vision: true, audio: true, video: true, context: '2M', speed: 'balanced' }
  },
  { 
    id: 'gemini-3-flash-preview', 
    displayName: 'Gemini 3 Flash Preview', 
    providerId: 'google',
    caps: { vision: true, audio: true, video: true, context: '1M', speed: 'ultra' } 
  },
  { 
    id: 'gemini-flash-latest', 
    displayName: 'Gemini Flash Latest', 
    providerId: 'google',
    caps: { vision: true, audio: true, video: true, context: '1M', speed: 'light' }
  },
  { 
    id: 'gemini-3.1-flash-lite', 
    displayName: 'Gemini Flash-Lite Latest', 
    providerId: 'google',
    caps: { vision: true, audio: false, video: false, context: '1M', speed: 'ultra' }
  }
];

export default function App() {
  const [sessions, setSessions] = useLocalStorage<Session[]>('droide_sessions', []);
  const [currentSessionId, setCurrentSessionId] = useLocalStorage<string | null>('droide_current_session', null);
  const [settings, setSettings] = useLocalStorage<AppSettings>('droide_settings', DEFAULT_SETTINGS);
  
  const [apiProviders, setApiProviders] = useLocalStorage<ApiProvider[]>('droide_api_providers', []);
  const [customModels, setCustomModels] = useLocalStorage<CustomModel[]>('droide_custom_models', []);
  
  const [inputText, setInputText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'privacy' | 'capabilities' | 'connectors' | 'ai-requirements'>('general');
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);
  const [installedMcpServers, setInstalledMcpServers] = useState<string[]>([]);

  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
  const [isMemoryMenuOpen, setIsMemoryMenuOpen] = useState(false);
  const [isSkillsMenuOpen, setIsSkillsMenuOpen] = useState(false);
  const [messageVersions, setMessageVersions] = useState<Record<string, number>>({});
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
  const [isCustomModelsOpen, setIsCustomModelsOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTool, setActiveTool] = useState<string | undefined>();
  const [pendingImages, setPendingImages] = useState<{ mimeType: string, data: string }[]>([]);
  const [errorText, setErrorText] = useState('');
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [showMicPrompt, setShowMicPrompt] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{name: string, content: string, mimeType: string}[]>([]);
  const [detectedCaps, setDetectedCaps] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [folders, setFolders] = useLocalStorage<Folder[]>('droide_folders', []);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [savedPrompts, setSavedPrompts] = useLocalStorage<SavedPrompt[]>('droide_saved_prompts', []);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isManageMemoriesOpen, setIsManageMemoriesOpen] = useState(false);
  const [isManageSharedChatsOpen, setIsManageSharedChatsOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollFAB, setShowScrollFAB] = useState(false);

  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [toastMessage, setToastMessage] = useState('');
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // --- Feature 10: Haptic Feedback ---
  const vibrate = (ms = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  };

  const handleSyncDatabase = () => {
    vibrate(150);
    // Real maintenance: cleanup orphaned folders, empty sessions, etc.
    setSessions(prev => prev.filter(s => s.messages.length > 0 || (Date.now() - s.updatedAt < 3600000)));
    showToast("Optimization Complete");
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    if (editingFolderId) {
      setFolders(prev => prev.map(f => f.id === editingFolderId ? { ...f, name: newFolderName } : f));
    } else {
      const newFolder: Folder = {
        id: crypto.randomUUID(),
        name: newFolderName,
        isOpen: true
      };
      setFolders(prev => [...prev, newFolder]);
    }
    setNewFolderName('');
    setEditingFolderId(null);
    setIsFolderModalOpen(false);
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setSessions(prev => prev.map(s => s.folderId === id ? { ...s, folderId: null } : s));
    showToast('Folder deleted');
  };

  const forkSession = (sessionId: string, messageId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const msgIndex = session.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const newMessages = session.messages.slice(0, msgIndex + 1);
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: `${session.title} (Forked)`,
      messages: newMessages,
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    showToast('Session forked');
  };

  const togglePinSession = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
  };

  const clearSessionMessages = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, messages: [] } : s));
    showToast('Session memory cleared');
  };

  const toggleFolder = (id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  const moveSessionToFolder = (sessionId: string, folderId: string | null) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, folderId } : s));
  };

  const filteredSessions = sessions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.messages.some(m => m.content.toLowerCase().includes(q));
  }).sort((a, b) => {
    // Pinned first, then by updatedAt descending
    const aPinned = a.isPinned ? 1 : 0;
    const bPinned = b.isPinned ? 1 : 0;
    if (bPinned !== aPinned) return bPinned - aPinned;
    return b.updatedAt - a.updatedAt;
  });

  const getMatchedSnippet = (session: Session) => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    const match = session.messages.find(m => m.content.toLowerCase().includes(q));
    if (!match) return null;
    
    const index = match.content.toLowerCase().indexOf(q);
    const start = Math.max(0, index - 40);
    const end = Math.min(match.content.length, index + q.length + 40);
    let snippet = match.content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < match.content.length) snippet = snippet + '...';
    return snippet;
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className="bg-[var(--accent)]/30 text-[var(--text-primary)] rounded-sm">{part}</span> 
            : part
        )}
      </>
    );
  };

  // --- Export Logic ---
  const exportToJSON = () => {
    vibrate();
    const data = JSON.stringify(currentSession, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${currentSession.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to JSON');
    setIsExportMenuOpen(false);
  };

  const exportToMarkdown = () => {
    vibrate();
    const md = `# ${currentSession.title}\n\n` + 
      currentSession.messages.map(m => `### ${m.role === 'user' ? 'User' : (m.modelName || 'Assistant')}\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${currentSession.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to Markdown');
    setIsExportMenuOpen(false);
  };

  const exportToPDF = () => {
    vibrate();
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = 30;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(settings.theme === 'dark' ? 30 : 0);
    doc.text(currentSession.title, margin, y);
    y += 12;

    // Metadata
    doc.setFontSize(9);
    doc.setTextColor(100);
    const dateStr = new Date(currentSession.updatedAt).toLocaleString();
    doc.text(`Created on: ${dateStr} • DROIDE AI Export`, margin, y);
    y += 15;

    doc.setFontSize(11);
    currentSession.messages.forEach((m) => {
      const role = m.role === 'user' ? 'USER' : (m.modelName?.toUpperCase() || 'ASSISTANT');
      
      // Check for page break before role header
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 20;
      }

      // Role Header with background color pill
      doc.setFont("helvetica", "bold");
      doc.setTextColor(role === 'USER' ? 217 : 50, role === 'USER' ? 119 : 150, role === 'USER' ? 87 : 50);
      doc.text(role, margin, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      
      // Clean content for PDF (simple markdown-like conversion to plain text)
      const cleanContent = m.content.replace(/```[\s\S]*?```/g, '[Code Block Removed in PDF Export]')
                                   .replace(/\[((?!\d\])[\s\S]*?)\]\(([\s\S]*?)\)/g, '$1 ($2)')
                                   .replace(/[*#]/g, '');

      const lines = doc.splitTextToSize(cleanContent, contentWidth);
      lines.forEach((line: string) => {
        if (y > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 6;
      });
      y += 10; // Space between messages
    });

    const fileName = `droide_chat_${currentSession.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
    showToast('Exported professional PDF');
    setIsExportMenuOpen(false);
  };

  // --- Prompt Library Logic ---
  const handleSavePrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return;
    if (editingPromptId) {
      setSavedPrompts(prev => prev.map(p => p.id === editingPromptId ? { ...p, name: newPromptName, content: newPromptContent, createdAt: p.createdAt || Date.now() } : p));
    } else {
      setSavedPrompts(prev => [...prev, { id: crypto.randomUUID(), name: newPromptName, content: newPromptContent, createdAt: Date.now() }]);
    }
    setNewPromptName('');
    setNewPromptContent('');
    setEditingPromptId(null);
    showToast('Prompt saved');
  };

  const handleExportData = () => {
    const exportObj = {
      sessions,
      settings,
      folders,
      savedPrompts,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `droide_export_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
  };

  const getChatFontFamily = () => {
    switch (settings.chatFont) {
      case 'DROIDE Serif': return 'var(--font-serif)';
      case 'Inter Sans': return 'var(--font-sans)';
      case 'JetBrains Mono': return 'var(--font-mono)';
      default: return settings.chatFont ? `"${settings.chatFont}", sans-serif` : 'inherit';
    }
  };

  const deletePrompt = (id: string) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
    showToast('Prompt deleted');
  };

  const usePrompt = (content: string) => {
    setInputText(content);
    setIsPromptLibraryOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || { id: 'default', title: 'New Chat', messages: [], updatedAt: Date.now() };

  // --- Feature 11: Dark/Light Theme enforcement ---
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // --- Dynamic Global Font Effect ---
  useEffect(() => {
    const font = settings.chatFont;
    if (!font || font === 'DROIDE Serif' || font === 'Inter Sans' || font === 'JetBrains Mono') {
       // reset to default if needed or ignore
       document.documentElement.style.removeProperty('--font-sans');
       document.documentElement.style.removeProperty('--font-serif');
       document.documentElement.style.removeProperty('--font-mono');
       document.body.style.fontFamily = '';
       return;
    }
    
    if (font === 'Terminal') {
      document.documentElement.style.setProperty('--font-sans', `"Terminal", monospace`);
      document.documentElement.style.setProperty('--font-serif', `"Terminal", monospace`);
      document.documentElement.style.setProperty('--font-mono', `"Terminal", monospace`);
      document.body.style.fontFamily = `"Terminal", monospace`;
      return;
    }
    
    // Load the font from Google Fonts dynamically
    const fontUrl = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
    let linkId = `google-font-${font.replace(/ /g, '-')}`;
    
    if (!document.getElementById(linkId)) {
       const link = document.createElement('link');
       link.id = linkId;
       link.href = fontUrl;
       link.rel = 'stylesheet';
       document.head.appendChild(link);
    }

    // Apply the font to the whole app by overriding the CSS variables
    document.documentElement.style.setProperty('--font-sans', `"${font}", sans-serif`);
    document.documentElement.style.setProperty('--font-serif', `"${font}", serif`);
    document.documentElement.style.setProperty('--font-mono', `"${font}", monospace`);
    document.body.style.fontFamily = `"${font}", sans-serif`;
  }, [settings.chatFont]);

  // --- Feature 16 & 19: Smart Scroll & Textarea resize ---
  useEffect(() => {
    if (scrollRef.current && shouldAutoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession.messages, isGenerating, shouldAutoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
    setShowScrollFAB(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
    }
  }, [inputText]);

  // --- Automatic Model Capability Detection ---
  useEffect(() => {
    if (!isModelSelectorOpen) return;

    const fetchAllCaps = async () => {
      const allModels = [...BUILT_IN_MODELS, ...customModels];
      
      for (const model of allModels) {
        if (detectedCaps[model.id] || (model as any).caps) continue;

        try {
          if ((model as any).providerId === 'google' && (settings.geminiApiKey || process.env.GEMINI_API_KEY)) {
            const meta = await getModelMetadata(model.id, settings.geminiApiKey || process.env.GEMINI_API_KEY as string);
            if (meta) {
              const caps = {
                vision: meta.description?.toLowerCase().includes('vision') || meta.supportedGenerationMethods?.includes('generateContent'),
                audio: meta.description?.toLowerCase().includes('audio'),
                video: meta.description?.toLowerCase().includes('video'),
                context: meta.inputTokenLimit ? (meta.inputTokenLimit >= 1000000 ? `${meta.inputTokenLimit / 1000000}M` : `${meta.inputTokenLimit / 1000}k`) : '?',
                speed: meta.description?.toLowerCase().includes('flash') ? 'extreme' : 'balanced'
              };
              setDetectedCaps(prev => ({ ...prev, [model.id]: caps }));
            }
          } else if ((model as any).providerId !== 'google') {
            const provider = apiProviders.find(p => p.id === (model as any).providerId);
            if (provider && provider.url && provider.apiKey) {
              const meta = await fetchCustomModelMetadata(provider.url, provider.apiKey, (model as any).modelId);
              if (meta) {
                const caps = meta.capabilities ? {
                  vision: meta.capabilities.vision,
                  audio: meta.capabilities.audio,
                  video: meta.capabilities.video,
                  context: meta.context_length ? (meta.context_length >= 1000000 ? `${meta.context_length / 1000000}M` : `${meta.context_length / 1000}k`) : '?',
                  speed: 'balanced'
                } : {
                  vision: (model as any).modelId.toLowerCase().includes('vision') || (model as any).modelId.toLowerCase().includes('-v'),
                  audio: (model as any).modelId.toLowerCase().includes('audio') || (model as any).modelId.toLowerCase().includes('speech'),
                  video: (model as any).modelId.toLowerCase().includes('video'),
                  context: '?',
                  speed: 'balanced'
                };
                setDetectedCaps(prev => ({ ...prev, [model.id]: caps }));
              }
            }
          }
        } catch (e) {
          console.error(`Auto-detect failed for ${model.id}`, e);
        }
      }
    };
    fetchAllCaps();
  }, [isModelSelectorOpen, settings.geminiApiKey, customModels, apiProviders]);

  const updateSession = (sessionId: string, updater: (s: Session) => Session, skipSort = false) => {
    setSessions(prev => {
      let exist = prev.find(p => p.id === sessionId);
      if (!exist) {
        exist = { id: sessionId, title: 'New Chat', messages: [], updatedAt: Date.now() };
        return [updater(exist), ...prev];
      }
      const updated = prev.map(p => p.id === sessionId ? updater(p) : p);
      return skipSort ? updated : updated.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  };

  const handleCreateSession = () => {
    vibrate();
    const newId = crypto.randomUUID();
    setCurrentSessionId(newId);
    setSessions(prev => [{ id: newId, title: 'New Chat', messages: [], updatedAt: Date.now() }, ...prev]);
    setIsDrawerOpen(false);
  };

  // --- Feature 8: Vision Upload ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    vibrate();
    setIsProcessingFiles(true);

    try {
      const fileList = Array.from(files) as File[];
      for (const file of fileList) {
        const fileName = file.name.toLowerCase();
        // Archive handling
        if (fileName.endsWith('.zip') || fileName.endsWith('.jar') || fileName.endsWith('.tar') || fileName.endsWith('.gz')) {
          const extracted = await extractArchive(file);
          const processed = await Promise.all(extracted.map(async (f) => {
            if (f.content instanceof ArrayBuffer) {
               const uint8 = new Uint8Array(f.content);
               let binary = '';
               const chunkSize = 16384;
               for (let i = 0; i < uint8.length; i += chunkSize) {
                 binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
               }
               const base64 = btoa(binary);
               return { mimeType: f.mimeType, data: base64, name: f.name };
            }
            return null;
          }));
          const valid = processed.filter((p): p is { mimeType: string, data: string, name: string } => p !== null);
          setPendingImages(prev => [...prev, ...valid]);
          showToast(`Extracted ${valid.length} files from ${file.name}`);
        } else {
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              const base64Data = dataUrl.split(',')[1];
              setPendingImages(prev => [...prev, { mimeType: file.type, data: base64Data, name: file.name }]);
              resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(file);
          });
        }
      }
    } catch (err: any) {
      setErrorText(`File processing error: ${err.message}`);
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const mapHistory = (msgs: Message[]): ChatHistoryItem[] => {
    return msgs.filter(m => !m.isStreaming).map(m => {
      const parts: any[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.images) m.images.forEach(img => parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } }));
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    });
  };

  const executeSend = async (userMessageContent: string, userImages: typeof pendingImages, prevMessages: Message[]) => {
    vibrate(100);
    setErrorText('');
    
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = Date.now().toString();
      setCurrentSessionId(activeSessionId);
    }
    const sessionId = activeSessionId;
    
    // --- Feature 14: Auto-title ---
    if (prevMessages.length === 0) {
      generateTitle(userMessageContent, { geminiApiKey: settings.geminiApiKey }).then(title => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
      });
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: userMessageContent, images: userImages, timestamp: Date.now() };
    const assistantMsgId = crypto.randomUUID();
    const selectedModel = customModels.find(m => m.id === settings.selectedModelId) || BUILT_IN_MODELS.find(m => m.id === settings.selectedModelId) || BUILT_IN_MODELS[0];
    const assistantMsg: Message = { 
      id: assistantMsgId, 
      role: 'assistant', 
      content: '', 
      isStreaming: true, 
      startTime: Date.now(),
      timestamp: Date.now(),
      modelName: selectedModel?.displayName || 'DROIDE'
    };
    
    updateSession(sessionId, s => ({ ...s, messages: [...prevMessages, userMsg, assistantMsg], updatedAt: Date.now() }));
    setIsGenerating(true);
    setShouldAutoScroll(true);
    setPendingImages([]);

    abortControllerRef.current = new AbortController();
    
    let accum = '';
    try {
      const customModel = customModels.find(m => m.id === settings.selectedModelId);
      const builtInModel = BUILT_IN_MODELS.find(m => m.id === settings.selectedModelId);
      const modelIdToUse = customModel ? customModel.modelId : (builtInModel ? ((builtInModel as any).modelId || builtInModel.id) : 'gemini-2.0-flash-exp');
      
      let providerConfig = undefined;
      if (customModel) {
        const prov = apiProviders.find(p => p.id === customModel.providerId);
        if (prov) providerConfig = { url: prov.url, apiKey: prov.apiKey };
      }
      
      const execConfig = {
        modelId: modelIdToUse,
        geminiApiKey: settings.geminiApiKey,
        provider: providerConfig,
        temperature: settings.temperature,
        topP: settings.topP,
        locationMetadata: settings.locationMetadata,
        improveDroide: settings.improveDroide,
        discoveryEnabled: settings.discoveryEnabled,
        generateMemory: settings.generateMemory,
        artifactsEnabled: settings.artifactsEnabled,
        aiArtifactsEnabled: settings.aiArtifactsEnabled,
        inlineVisualizations: settings.inlineVisualizations,
        codeExecution: settings.codeExecution,
        networkEgress: settings.networkEgress,
        toolAccessMode: settings.toolAccessMode,
      };

      const handleToolCall = (call: { name: string, args: any }) => {
        console.log("AI Tool Call:", call);
        setActiveTool(call.name);
        
        if (call.name === 'update_app_settings') {
          setSettings(prev => ({ ...prev, ...call.args }));
          showToast(`Settings updated by AI`);
          return { success: true };
        } else if (call.name === 'clear_chat_history') {
          if (sessionId) updateSession(sessionId, s => ({ ...s, messages: [] }));
          showToast(`Chat history cleared`);
          return { success: true };
        } else if (call.name === 'get_current_time') {
          showToast(`AI requested current time`);
          return { dateTime: new Date().toLocaleString() };
        } else if (call.name === 'save_file') {
          const { fileName, content, mimeType } = call.args;
          setPendingImages(prev => [...prev, { name: fileName, data: content, mimeType: mimeType || 'text/plain' }]);
          showToast(`AI generated: ${fileName}`);
          return { success: true, fileName };
        } else if (call.name === 'save_prompt') {
          const { name, content } = call.args;
          const newPrompt = { id: Math.random().toString(36).substring(7), name, content, createdAt: Date.now() };
          setSavedPrompts(prev => [...prev, newPrompt]);
          showToast(`Persona/Prompt '${name}' saved successfully!`);
          return { success: true, message: `Saved Persona to Prompt Library natively.` };
        } else if (call.name === 'install_skill') {
          const { name, description, standard } = call.args;
          const newSkill = { id: Math.random().toString(36).substring(7), name, description, standard, installedAt: Date.now() };
          setSettings(prev => ({ ...prev, installedSkills: [...(prev.installedSkills || []), newSkill] }));
          showToast(`Skill '${name}' installed natively!`);
          return { success: true, message: `Installed new skill to app settings.` };
        } else if (call.name === 'report_ai_requirement') {
          const { title, details } = call.args;
          const newReq = { id: Math.random().toString(36).substring(7), title, details, timestamp: Date.now() };
          setSettings(prev => ({ ...prev, aiRequirements: [newReq, ...(prev.aiRequirements || [])] }));
          showToast(`AI posted a requirement: ${title}`);
          return { success: true, message: `Requirement '${title}' posted to Settings > AI REQUIREMENTS.` };
        } else if (call.name === 'generate_image') {
          const { prompt } = call.args;
          const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
          setPendingImages(prev => [...prev, { name: 'Generated Image', data: imageUrl, mimeType: 'image/url', isUrl: true }]);
          showToast(`AI generating image: ${prompt}`);
          return { success: true, imageUrl };
        } else if (call.name === 'execute_code') {
          showToast(`AI is executing ${call.args.language} code...`);
          return { success: true, message: "Code execution started" }; // Real work done in gemini.ts
        } else if (call.name === 'read_url_content') {
          showToast(`AI is reading from ${call.args.url}...`);
          return { success: true, message: "Reading content" }; // Real work done in gemini.ts
        } else if (call.name === 'get_weather') {
          showToast(`AI checking weather...`);
          return { success: true, message: "Weather data fetched" }; // Real work done in gemini.ts
        } else if (call.name === 'search_places') {
          showToast(`AI searching places...`);
          return { success: true, message: "Places found" }; // Real work done in gemini.ts
        } else if (call.name === 'get_sports_data') {
          showToast(`AI checking sports...`);
          return { success: true, message: "Sports data synced" }; // Real work done in gemini.ts
        } else if (call.name === 'manage_memory') {
          const { action, fact } = call.args;
          let newStatus = 'skipped';
          
          if (action === 'learn' && fact) {
            if (!settings.userMemories?.includes(fact)) {
              setSettings(prev => ({ ...prev, userMemories: [...(prev.userMemories || []), fact] }));
              showToast(`AI learned a new fact about you.`);
              newStatus = 'learned';
            }
          } else if (action === 'forget' && fact) {
            if (settings.userMemories?.includes(fact)) {
              setSettings(prev => ({ ...prev, userMemories: prev.userMemories.filter(m => m !== fact) }));
              showToast(`AI forgot a fact.`);
              newStatus = 'forgotten';
            }
          }
          return { success: true, action, status: newStatus };
        }
      };

      const formattedMemories = settings.userMemories?.length > 0 ? `\n\nUSER MEMORIES/FACTS (Keep these in mind):\n${settings.userMemories.map(m => `- ${m}`).join('\n')}` : '';
      const skillContext = settings.installedSkills?.length > 0 ? `\n\nAVAILABLE SKILLS (These capabilities are abstractly available, adapt responses to assume these constraints when asked):\n${settings.installedSkills.map(s => `- ${s.name}: ${s.description}`).join('\n')}` : '';

      const fullInstruction = settings.systemPrompt + 
        (settings.forceBengali ? "\n\nIMPORTANT: You MUST reply in Bengali or Banglish for all your responses." : "") +
        formattedMemories + skillContext;

      await streamChat(
        mapHistory(prevMessages),
        userMessageContent,
        userImages,
        fullInstruction,
        abortControllerRef.current.signal,
        (chunk) => {
          accum += chunk;
          if (settings.streamResponses) {
            updateSession(sessionId, s => ({
              ...s, 
              messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: accum } : m)
            }), true); // Skip sort during streaming for performance
          }
        },
        execConfig,
        handleToolCall
      );

      if (settings.autoTts && accum) {
        speakText(accum, assistantMsgId);
      }
    } catch (e: any) {
      if (e.message === 'MISSING_API_KEY') {
        setErrorText('API_KEY_ERROR');
      } else if (e.message === 'Failed to fetch' || String(e.message).includes('Failed to fetch')) {
        setErrorText('Failed to establish connection to the API. This is usually caused by ad-blockers, network configuration, or CORS blocking.');
      } else if (e.message !== 'AbortError') {
        setErrorText(String(e.message || 'Error occurred'));
      }
    } finally {
      updateSession(sessionId, s => ({
        ...s,
        messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: accum, isStreaming: false, endTime: Date.now() } : m)
      }));
      setIsGenerating(false);
      abortControllerRef.current = null;
      
      // Feature: Task Completion Notification
      if (settings.notifications?.taskCompletion) {
        if ('Notification' in window && Notification.permission === 'granted') {
           new Notification('Droide', { body: 'Generation completed!' });
        }
        if (settings.notifications?.soundEnabled) {
           const audio = new Audio('/notification.mp3');
           // Just playing a short beep as fallback if file doesn't exist
           audio.play().catch(() => {
             const ctx = new window.AudioContext();
             const osc = ctx.createOscillator();
             osc.connect(ctx.destination);
             osc.frequency.value = 880;
             osc.start();
             osc.stop(ctx.currentTime + 0.1);
           });
        }
      }

      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSend = () => {
    if ((!inputText.trim() && pendingImages.length === 0) || isGenerating) return;
    const text = inputText;
    setInputText('');
    executeSend(text, pendingImages, currentSession.messages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Feature 5: Stop Generation ---
  const handleStop = () => {
    vibrate();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsGenerating(false);
  };

  // --- Feature 3: Regenerate Response ---
  const handleRegenerate = () => {
    vibrate(100);
    const msgs = [...currentSession.messages];
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') msgs.pop();
    const lastUser = msgs.pop();
    if (!lastUser) return;
    executeSend(lastUser.content, lastUser.images || [], msgs);
  };

  // --- Feature 4: Edit Message (Inline) ---
  const handleEdit = (msg: Message) => {
    vibrate();
    setEditingMessageId(msg.id);
    setEditingMessageText(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleSaveEdit = (msgId: string) => {
    vibrate(100);
    const msg = currentSession.messages.find(m => m.id === msgId);
    if (!msg) return;

    if (msg.role === 'user') {
      const idx = currentSession.messages.findIndex(m => m.id === msgId);
      const prior = currentSession.messages.slice(0, idx);
      setEditingMessageId(null);
      executeSend(editingMessageText, msg.images || [], prior);
    } else {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
        ...s,
        messages: s.messages.map(m => m.id === msgId ? {
          ...m,
          edits: [...(m.edits || []), { content: m.content, timestamp: Date.now() }],
          content: editingMessageText
        } : m)
      } : s));
      setEditingMessageId(null);
    }
  };

  // --- Feature 18: Delete single Message ---
  const handleDeleteMsg = (id: string) => {
    vibrate(30);
    if (currentSessionId) updateSession(currentSessionId, s => ({ ...s, messages: s.messages.filter(m => m.id !== id) }));
  };

  // --- Feature 6 & 13: Copy & Share APIs ---
  const handleCopy = (text: string) => { 
    vibrate(); 
    navigator.clipboard.writeText(text); 
    showToast('Copied to clipboard');
  };
  const handleShare = async (text: string) => {
    vibrate();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'DROIDE Response', text });
      } catch (err) {
         // handle cancel or unhandled rejection gracefully
      }
    } else {
      handleCopy(text);
    }
  };

  // Add ref for TTS audio
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- Feature 12: Text-to-Speech ---
  const speakText = async (text: string, id: string | null = null) => {
    vibrate();

    // Stop current speaking
    window.speechSynthesis.cancel();
    if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
    }

    if (isSpeakingId === id && id !== null) {
        setIsSpeakingId(null);
        showToast('Stopped audio');
        return;
    }

    if (id) setIsSpeakingId(id);

    try {
      // Remove code blocks, inline code, and URLs to ensure only generated text is read
      const textToRead = text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks completely
        .replace(/`([^`]+)`/g, '$1')    // Strip inline code backticks
        .replace(/https?:\/\/[^\s]+/g, 'link') // Replace URLs
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Extract text from markdown links
        .replace(/[*_~#>-]/g, '')       // Remove markdown symbols but keep punctuation
        .trim();

      if (!textToRead) {
        setIsSpeakingId(null);
        showToast('No readable text found');
        return;
      }

      showToast('Speaking naturally...');

      const isBangla = /[\u0980-\u09FF]/.test(textToRead);
      const lang = isBangla ? 'bn-BD' : 'en-US';
      
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = lang;
      
      // Attempt to load and select highest-quality voices for human-like prosody 
      let voices = window.speechSynthesis.getVoices();
      
      const utterAndPlay = () => {
        voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const langVoices = voices.filter(v => v.lang.startsWith(isBangla ? 'bn' : 'en'));
          if (langVoices.length > 0) {
            const premiumVoice = langVoices.find(v => 
              v.name.toLowerCase().includes('online') || 
              v.name.toLowerCase().includes('premium') || 
              v.name.toLowerCase().includes('natural')
            ) || langVoices.find(v => v.name.includes('Google') || v.name.includes('Microsoft'));
            
            if (premiumVoice) {
              utterance.voice = premiumVoice;
            } else {
              utterance.voice = langVoices[0];
            }
          }
        }

        // Tuned for natural reading
        utterance.rate = isBangla ? 0.95 : 1.0; 
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          setIsSpeakingId(null);
        };
        
        utterance.onerror = () => {
          setIsSpeakingId(null);
          showToast('Error playing audio');
        };

        window.speechSynthesis.speak(utterance);
      };

      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          utterAndPlay();
        };
      } else {
        utterAndPlay();
      }
    } catch (err) {
      console.error(err);
      setIsSpeakingId(null);
      showToast('Error generating TTS');
    }
  };

  // --- Feature 17: Format Toolbar Shortcuts ---
  const insertFormat = (prefix: string, suffix = prefix) => {
    if (!inputRef.current) return;
    vibrate(30);
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    const val = inputText;
    const next = val.substring(0, start) + prefix + val.substring(start, end) + suffix + val.substring(end);
    setInputText(next);
    setTimeout(() => {
      inputRef.current!.focus();
      inputRef.current!.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // --- Feature 9: Voice Dictation ---
  const handleVoice = () => {
    vibrate();
    setShowMicPrompt(true);
  };

  const startVoiceDictation = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      showToast('Voice dictation not supported in this browser.');
      return;
    }
    try {
      const recognition = new SR();
      recognition.onstart = () => showToast('Listening...');
      recognition.onerror = (e: any) => showToast(`Voice input error: ${e.error}`);
      recognition.onresult = (e: any) => setInputText(prev => prev + (prev ? ' ' : '') + e.results[0][0].transcript);
      recognition.start();
    } catch(err) {
      showToast('Microphone access denied or error');
    }
  };

  // --- Feature 20: Word/Token Counter ---
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 bg-[var(--bg-main)] text-[var(--text-secondary)] font-sans overflow-hidden flex flex-col w-full h-full">
      
      {/* Drawer Overlay */}
      {isDrawerOpen && <div id="drawer-overlay" className="fixed inset-0 bg-black/40 z-[100] transition-opacity duration-250 ease-out" onClick={() => setIsDrawerOpen(false)} />}
      
      {/* Toast Notification */}
      {toastMessage && (
        <div id="toast-notification" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-[var(--text-secondary)] text-[var(--bg-main)] px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

      {isMemoryMenuOpen && <MemoryMenu settings={settings} setSettings={setSettings} onClose={() => setIsMemoryMenuOpen(false)} vibrate={vibrate} showToast={showToast} />}
      {isSkillsMenuOpen && <SkillsMenu settings={settings} setSettings={setSettings} onClose={() => setIsSkillsMenuOpen(false)} vibrate={vibrate} showToast={showToast} />}

      {/* Feature 2: Native Android Drawer */}
      <div id="side-drawer" className={`fixed inset-y-0 left-0 w-[85vw] max-w-[320px] bg-[var(--bg-drawer)] shadow-2xl z-[120] transform transition-transform duration-300 ease-out flex flex-col pt-[max(env(safe-area-inset-top),8px)] pb-[max(env(safe-area-inset-bottom),8px)] ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 pb-3 border-b border-[var(--border-drawer)] flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
             <BrandLogo className="w-10 h-10 text-[var(--logo-color)]" />
             <h2 className="font-serif text-[1.4rem] tracking-tighter text-[var(--logo-color)]">DROIDE</h2>
          </div>
          <button onClick={() => { setIsDrawerOpen(false); vibrate(); }} className="p-2 -mr-2 hover:bg-[var(--surface-hover)] rounded-full transition-colors sm:hidden active:scale-95">
             <X className="w-6 h-6 text-[var(--text-primary)]" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pt-2 px-3 no-scrollbar space-y-3">
          {/* Search Bar */}
          <div className="sticky top-0 bg-[var(--bg-drawer)] z-10 pb-1.5">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search within chats..." 
                value={searchQuery}
                autoComplete="off"
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className={`w-full text-sm py-2 pl-10 pr-10 rounded-2xl bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all ${isSearchFocused ? 'shadow-md border-[var(--accent)]/50' : ''}`}
              />
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)]" /> 
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">{filteredSessions.length} sessions found</span>
                <button onClick={() => setSearchQuery('')} className="text-[10px] font-semibold text-[var(--text-muted)]">Clear</button>
              </div>
            )}
          </div>

          <button onClick={handleCreateSession} className="w-full flex items-center justify-between px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl android-ripple font-medium">
            <span>New chat</span>
            <Plus className="w-5 h-5" />
          </button>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Folders</h3>
              <button 
                onClick={() => { setEditingFolderId(null); setNewFolderName(''); setIsFolderModalOpen(true); vibrate(); }}
                className="p-1 hover:bg-[var(--surface-hover)] rounded-md text-[var(--accent)]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {folders.map(folder => {
                const folderSessions = filteredSessions.filter(s => s.folderId === folder.id);
                return (
                  <div key={folder.id} className="space-y-1">
                    <div className="flex items-center group px-1">
                      <button 
                        onClick={() => toggleFolder(folder.id)}
                        className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${folder.isOpen ? '' : '-rotate-90'}`} />
                        <FolderIcon className="w-4 h-4 text-[var(--accent)] opacity-70" />
                        <span className="truncate">{folder.name}</span>
                        <span className="text-[10px] bg-[var(--surface-border)] px-1.5 py-0.5 rounded-full text-[var(--text-muted)]">{folderSessions.length}</span>
                      </button>
                      <div className="flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingFolderId(folder.id); setNewFolderName(folder.name); setIsFolderModalOpen(true); vibrate(); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)]"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteFolder(folder.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {folder.isOpen && (
                      <div className="pl-4 space-y-1">
                        {folderSessions.map(s => (
                           <div key={s.id} className="relative group">
                            <button 
                              onClick={() => { setCurrentSessionId(s.id); setIsDrawerOpen(false); vibrate(); }}
                              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors pr-10
                                ${s.id === currentSessionId ? 'bg-[var(--surface-hover)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
                            >
                              <div className="truncate">{highlightText(s.title, searchQuery)}</div>
                              {searchQuery && getMatchedSnippet(s) && (
                                <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 opacity-80 font-normal italic">
                                  {highlightText(getMatchedSnippet(s)!, searchQuery)}
                                </div>
                              )}
                            </button>
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                               <button onClick={() => togglePinSession(s.id)} className={`p-1.5 ${s.isPinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} hover:text-[var(--accent)]`} title={s.isPinned ? "Unpin" : "Pin"}>
                                 <BookMarked className="w-3.5 h-3.5" />
                               </button>
                               <button onClick={() => moveSessionToFolder(s.id, null)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)]" title="Remove from folder">
                                  <X className="w-3.5 h-3.5" />
                               </button>
                            </div>
                           </div>
                        ))}
                        {folderSessions.length === 0 && <div className="px-5 py-2 text-[11px] text-[var(--text-muted)] italic">No sessions</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="space-y-1">
              <h3 className="px-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2 mb-1.5">Standalone Chats</h3>
              {filteredSessions.filter(s => !s.folderId).map(s => (
                <div key={s.id} className="relative group">
                  <button 
                    onClick={() => { setCurrentSessionId(s.id); setIsDrawerOpen(false); vibrate(); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors pr-12
                      ${s.id === currentSessionId ? 'bg-[var(--surface-hover)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
                  >
                    <div className="truncate text-sm">{highlightText(s.title, searchQuery)}</div>
                    {searchQuery && getMatchedSnippet(s) && (
                      <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 opacity-80 font-normal italic">
                        {highlightText(getMatchedSnippet(s)!, searchQuery)}
                      </div>
                    )}
                  </button>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0 opacity-100 sm:opacity-30 sm:group-hover:opacity-100">
                    <button onClick={() => togglePinSession(s.id)} className={`p-2 ${s.isPinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} hover:text-[var(--accent)]`} title={s.isPinned ? "Unpin" : "Pin"}>
                       <BookMarked className="w-4 h-4" />
                    </button>
                    <div className="relative group/menu">
                      <button className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)]"><Box className="w-4 h-4" /></button>
                      <div className="absolute right-0 bottom-full mb-1 w-48 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl shadow-2xl z-[70] hidden group-focus-within/menu:block hover:block overflow-hidden">
                        <div className="p-2 space-y-1 bg-[var(--bg-main)]">
                          <p className="px-3 py-1.5 text-[10px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--surface-border)] mb-1">Move to Folder</p>
                          <div className="max-h-40 overflow-y-auto no-scrollbar">
                            {folders.length === 0 ? (
                              <p className="px-3 py-2 text-[10px] text-[var(--text-muted)] italic">No folders created</p>
                            ) : (
                              folders.map(f => (
                                <button key={f.id} onClick={() => moveSessionToFolder(s.id, f.id)} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[var(--surface-hover)] truncate transition-colors flex items-center gap-2">
                                  <FolderIcon className="w-3.5 h-3.5 opacity-50" />
                                  {f.name}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); vibrate(); setSessionToDelete(s.id); }} 
                      className="p-2 text-[var(--danger)] active:scale-90 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`p-3 border-t border-[var(--border-drawer)] space-y-0.5 transition-all duration-300 ${isSearchFocused || searchQuery ? 'hidden' : 'block'}`}>
          <button onClick={() => { setIsMemoryMenuOpen(true); setIsDrawerOpen(false); vibrate(); }} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] android-ripple font-medium text-left">
            <Brain className="w-5 h-5 text-[var(--accent)]" />
            <span>Memory & Persona</span>
          </button>
          
          <button onClick={() => { setIsSkillsMenuOpen(true); setIsDrawerOpen(false); vibrate(); }} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] android-ripple font-medium text-left">
            <Blocks className="w-5 h-5 text-[var(--accent)]" />
            <span>Skills & Integrations</span>
          </button>

          <button onClick={() => { setIsAiConfigOpen(true); setIsDrawerOpen(false); vibrate(); }} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] android-ripple font-medium text-left">
            <Zap className="w-5 h-5 text-blue-500" />
            <span>AI Config</span>
          </button>

          <div className="flex items-center justify-between px-4 py-2.5 mt-1">
            <div className="flex items-center space-x-3">
              {settings.theme === 'dark' ? <Moon className="w-5 h-5 text-[var(--text-muted)]" /> : <Sun className="w-5 h-5 text-[var(--text-muted)]" />}
              <span className="font-medium">Dark Theme</span>
            </div>
            <button onClick={() => setSettings(p => ({...p, theme: p.theme === 'dark' ? 'light' : 'dark'}))} className={`w-10 h-6 rounded-full transition-colors relative ${settings.theme === 'dark' ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.theme === 'dark' ? 'translate-x-5' : 'translate-x-1'}`}></div>
            </button>
          </div>

          <button 
            onClick={() => { setIsSettingsOpen(true); setIsDrawerOpen(false); vibrate(); }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 mt-1 rounded-xl hover:bg-[var(--surface-hover)] bg-[var(--surface)] border border-[var(--surface-border)] shadow-sm transition-all text-left"
          >
            <div className="w-9 h-9 rounded-full border border-[var(--surface-border)] flex items-center justify-center bg-[var(--surface-hover)] overflow-hidden shrink-0">
              {settings.avatarUrl ? (
                <img src={settings.avatarUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">{settings.nickname?.charAt(0) || settings.fullName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{settings.nickname || settings.fullName || 'Guest User'}</div>
              <div className="text-[10px] text-[--success] flex items-center gap-1 opacity-70">
                <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></div>
                <span>Status: Synced (Local)</span>
              </div>
            </div>
            <SettingsIcon className="w-4 h-4 text-[var(--text-muted)] opacity-50" />
          </button>
          
          <div className="px-4 py-1.5 mt-1 border-t border-[var(--surface-border)]">
            <p className="text-[10px] text-center text-[var(--text-muted)] font-medium tracking-wide uppercase">Developed by /dzdev</p>
          </div>
        </div>
      </div>

      <DeleteSessionModal 
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={() => {
          if (!sessionToDelete) return;
          setSessions(prev => prev.filter(x => x.id !== sessionToDelete));
          if (sessionToDelete === currentSessionId) {
            handleCreateSession();
          }
          setSessionToDelete(null);
          showToast('Chat deleted');
        }}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        settingsTab={settingsTab as any}
        setSettingsTab={setSettingsTab as any}
        vibrate={vibrate}
        onExportData={handleExportData}
        onManageMemories={() => setIsManageMemoriesOpen(true)}
        onManageSharedChats={() => setIsManageSharedChatsOpen(true)}
        onBrowseConnectors={() => { setIsSettingsOpen(false); setIsConnectorsModalOpen(true); }}
      />

      <ConnectorsModal
        isOpen={isConnectorsModalOpen}
        onClose={() => setIsConnectorsModalOpen(false)}
        installedServers={installedMcpServers}
        onInstall={(id) => {
          vibrate();
          setInstalledMcpServers(prev => [...prev, id]);
          showToast('Connector installed');
        }}
        onUninstall={(id) => {
          vibrate();
          setInstalledMcpServers(prev => prev.filter(x => x !== id));
          showToast('Connector removed');
        }}
      />

      {/* Memory Management Modal */}
      {isManageMemoriesOpen && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-main)] rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-drawer)]">
              <h3 className="font-bold text-[var(--text-primary)]">Manage Memory</h3>
              <button onClick={() => setIsManageMemoriesOpen(false)}><X className="w-6 h-6 text-[var(--text-muted)]" /></button>
            </div>
            <div className="p-5 max-h-[60%] overflow-y-auto space-y-3">
              {settings.userMemories && settings.userMemories.length > 0 ? (
                settings.userMemories.map((m, idx) => (
                  <div key={idx} className="p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--surface-border)] text-xs text-[var(--text-secondary)] flex items-start justify-between">
                    <span className="flex-1 mr-2">{m}</span>
                    <button 
                      onClick={() => {
                        setSettings(p => ({ ...p, userMemories: p.userMemories.filter((_, i) => i !== idx) }));
                        vibrate(30);
                      }}
                      className="text-red-500 font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-[var(--text-muted)] text-sm">No memories recorded yet.</div>
              )}
            </div>
            <div className="p-4 border-t border-[var(--border-drawer)] flex gap-2">
              <button 
                onClick={() => {
                  setSettings(p => ({ ...p, userMemories: [] }));
                  vibrate(50);
                }}
                className="flex-1 py-3 border border-red-200 text-red-500 rounded-xl font-bold text-sm"
              >
                Clear All
              </button>
              <button 
                onClick={() => setIsManageMemoriesOpen(false)}
                className="flex-1 py-3 bg-[var(--text-primary)] text-[var(--bg-main)] rounded-xl font-bold text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Shared Chats Modal */}
      {isManageSharedChatsOpen && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="bg-[var(--bg-main)] rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-drawer)]">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-bold text-[var(--text-primary)]">Shared Chats</h3>
              </div>
              <button onClick={() => setIsManageSharedChatsOpen(false)}><X className="w-6 h-6 text-[var(--text-muted)]" /></button>
            </div>
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-[var(--surface-hover)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--surface-border)]">
                <Globe className="w-8 h-8 text-[var(--text-muted)] opacity-30" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">No public links yet</p>
              <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">Publicly shared chat links will appear here. Currently, sharing uses the device-native share API.</p>
            </div>
            <div className="p-4 border-t border-[var(--border-drawer)]">
              <button 
                onClick={() => setIsManageSharedChatsOpen(false)}
                className="w-full py-3 bg-[var(--text-primary)] text-[var(--bg-main)] rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Config Full Screen */}
      {isAiConfigOpen && (
        <div className="fixed inset-0 bg-[var(--bg-main)] z-[150] flex flex-col pt-[max(env(safe-area-inset-top),8px)] pb-[max(env(safe-area-inset-bottom),8px)] animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-5 pb-4">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsAiConfigOpen(false)} 
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] mr-2 p-1"
              >
                <X className="w-6 h-6" />
              </button>
              <nav className="flex items-center font-medium tracking-tight mt-0.5">
                <span 
                  onClick={() => setIsAiConfigOpen(false)}
                  className="cursor-pointer text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Home
                </span>
                <ChevronRight className="w-3 h-3 mx-1 text-[var(--text-muted)] opacity-50" />
                <span className="text-[11px] text-[var(--text-primary)]">Intelligence</span>
              </nav>
            </div>
            <div className="opacity-10 text-[var(--text-primary)] mt-2">
              <Zap className="w-10 h-10" />
            </div>
          </div>
            
          <div className="flex-1 overflow-y-auto mt-2 pb-20">
            <div className="space-y-3 px-5 mt-2">
              <button 
                onClick={() => { setIsAiConfigOpen(false); setIsApiConfigOpen(true); vibrate(); }} 
                className="w-full flex items-center gap-4 p-4 bg-[var(--surface-variant)] border border-[var(--surface-border)] rounded-[1.5rem] transition-all shadow-sm active:scale-[0.98]"
              >
                <div className="p-3 border border-blue-500/20 rounded-xl bg-blue-500/10">
                  <Database className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-[15px] text-[var(--text-primary)]">API Providers</p>
                  <p className="text-[13px] text-[var(--text-muted)] mt-0.5 leading-tight">Configure keys for Gemini, OpenAI,<br/>and custom endpoints.</p>
                </div>
                <ChevronDown className="w-5 h-5 text-[var(--text-muted)] opacity-50 -rotate-90" />
              </button>

              <button 
                onClick={() => { setIsAiConfigOpen(false); setIsCustomModelsOpen(true); vibrate(); }} 
                className="w-full flex items-center gap-4 p-4 bg-[var(--surface-variant)] border border-[var(--surface-border)] rounded-[1.5rem] transition-all shadow-sm active:scale-[0.98]"
              >
                <div className="p-3 border border-purple-500/20 rounded-xl bg-purple-500/10">
                  <Cpu className="w-6 h-6 text-purple-500" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-[15px] text-[var(--text-primary)]">Custom Models</p>
                  <p className="text-[13px] text-[var(--text-muted)] mt-0.5 leading-tight">Add and manage specific model IDs<br/>and capabilities.</p>
                </div>
                <ChevronDown className="w-5 h-5 text-[var(--text-muted)] opacity-50 -rotate-90" />
              </button>
            </div>

            <div className="mt-8 mb-4 px-6">
              <p className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest uppercase">AI PARAMETERS</p>
            </div>
              
            <div className="space-y-6 px-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <p className="text-[var(--text-primary)] text-[15px] font-bold">Temperature</p>
                  <span className="text-[12px] font-bold bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full">{(settings.temperature ?? 0.7).toFixed(1)}</span>
                </div>
                <div className="relative flex items-center w-full">
                   <input type="range" min="0" max="2" step="0.1" value={settings.temperature ?? 0.7} onChange={e => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[var(--surface-border)] accent-blue-500" style={{background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(settings.temperature ?? 0.7) * 50}%, var(--surface-border) ${100}%, var(--surface-border) 100%)`}}/>
                </div>
                <p className="text-[13px] text-[var(--text-muted)] mt-1">Lower is focused, higher is creative.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium border-t border-[var(--surface-border)] pt-6 mt-6">
                  <p className="text-[var(--text-primary)] text-[15px] font-bold">Top-P</p>
                  <span className="text-[12px] font-bold bg-purple-500/10 text-purple-500 px-2.5 py-1 rounded-full">{(settings.topP ?? 0.95).toFixed(2)}</span>
                </div>
                <div className="relative flex items-center w-full">
                   <input type="range" min="0" max="1" step="0.05" value={settings.topP ?? 0.95} onChange={e => setSettings(prev => ({ ...prev, topP: parseFloat(e.target.value) }))} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[var(--surface-border)] accent-purple-500" style={{background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(settings.topP ?? 0.95) * 100}%, var(--surface-border) ${100}%, var(--surface-border) 100%)`}}/>
                </div>
                <p className="text-[13px] text-[var(--text-muted)] mt-1">Nucleus sampling: filters high probability tokens.</p>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--surface-border)] pt-6 mt-6 pb-4">
                <div className="flex-1 mr-4">
                  <p className="text-[15px] font-bold text-[var(--text-primary)]">Adaptive Thinking</p>
                  <p className="text-[13px] text-[var(--text-muted)] mt-1 leading-tight">Let AI decide when to use chain-of-thought<br/>processing.</p>
                </div>
                <button 
                  onClick={() => {
                    setSettings(p => ({ ...p, adaptiveThinking: !p.adaptiveThinking }));
                    vibrate(50);
                  }} 
                  className={`w-14 h-7 rounded-full transition-colors relative shrink-0 ${settings.adaptiveThinking ? 'bg-[var(--accent)]' : 'bg-[var(--surface-border)]'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm ${settings.adaptiveThinking ? 'translate-x-[26px]' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
            </div>
            <div className="px-5 mt-6 mb-24">
            </div>
          </div>
          <div className="absolute bottom-4 inset-x-4">
             <button onClick={() => setIsAiConfigOpen(false)} className="w-full bg-[var(--text-primary)] text-[var(--bg-main)] font-semibold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-transform text-[15px] flex items-center justify-center">
               Done
             </button>
          </div>
        </div>
      )}
      {isApiConfigOpen && (
        <div className="fixed inset-0 bg-[var(--bg-main)] z-[150] flex flex-col pt-[max(env(safe-area-inset-top),8px)] pb-[max(env(safe-area-inset-bottom),8px)] animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-5 pb-4">
            <div className="flex items-center gap-1">
              <button onClick={() => { setIsApiConfigOpen(false); setEditingProviderId(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] mr-2 p-1">
                <X className="w-6 h-6" />
              </button>
              <nav className="flex items-center font-medium tracking-tight mt-0.5">
                <span 
                  onClick={() => { setIsApiConfigOpen(false); setIsAiConfigOpen(true); setEditingProviderId(null); vibrate(); }}
                  className="cursor-pointer text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Intelligence
                </span>
                <ChevronRight className="w-3 h-3 mx-1 text-[var(--text-muted)] opacity-50" />
                <span className="text-[11px] text-[var(--text-primary)]">API Providers</span>
              </nav>
            </div>
            <div className="opacity-10 dark:opacity-20 text-[var(--text-primary)] mt-2">
              <Database className="w-10 h-10" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto mt-2 pb-24">
            <section className="mx-5 mb-6">
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest uppercase mb-4 pl-1">{editingProviderId ? 'Edit Provider' : 'Add New Provider'}</h3>
              <form className="space-y-4 p-5 bg-[var(--surface-variant)] border border-[var(--surface-border)] rounded-[1.5rem] shadow-sm" onSubmit={(e) => {
                e.preventDefault();
                vibrate();
                const fd = new FormData(e.currentTarget);
                const name = fd.get('name') as string;
                const url = fd.get('url') as string;
                const apiKey = fd.get('apiKey') as string;
                if (!name || !url) { showToast('Name and URL required'); return; }
                
                if (editingProviderId) {
                  setApiProviders(p => p.map(x => x.id === editingProviderId ? { ...x, name, url, apiKey } : x));
                  setEditingProviderId(null);
                  showToast('Provider updated');
                } else {
                  setApiProviders(p => [...p, { id: Date.now().toString(), name, url, apiKey }]);
                  showToast('Provider added');
                }
                (e.target as HTMLFormElement).reset();
              }}>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-2">Display Name</label>
                  <input name="name" defaultValue={editingProviderId ? apiProviders.find(p => p.id === editingProviderId)?.name : ''} placeholder="e.g. OpenRouter" className="w-full p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none text-[var(--text-primary)] transition-all font-medium" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-2">Base URL</label>
                  <input name="url" defaultValue={editingProviderId ? apiProviders.find(p => p.id === editingProviderId)?.url : ''} placeholder="https://api.example.com/v1" className="w-full p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none text-[var(--text-primary)] transition-all font-medium" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-2">API Key</label>
                  <input name="apiKey" type="password" defaultValue={editingProviderId ? apiProviders.find(p => p.id === editingProviderId)?.apiKey : ''} placeholder="sk-..." className="w-full p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none text-[var(--text-primary)] transition-all font-medium" required />
                </div>
                <div className="flex gap-3 pt-4">
                  {editingProviderId && (
                    <button type="button" onClick={() => setEditingProviderId(null)} className="flex-1 bg-[var(--surface-variant)] border border-[var(--surface-border)] text-[var(--text-primary)] py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform">Cancel</button>
                  ) }
                  <button type="submit" className="flex-[2] bg-[var(--accent)] text-white py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform shadow-md">{editingProviderId ? 'Update Provider' : 'Add Provider'}</button>
                </div>
              </form>
            </section>

            <section className="mx-5">
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 pl-1">Configured Providers ({apiProviders.length})</h3>
              <div className="space-y-3">
                {apiProviders.length === 0 ? (
                  <div className="mx-0 bg-[var(--surface-variant)] border border-[var(--surface-border)] rounded-[1.5rem] p-8 shadow-[0_0_15px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-20 h-20 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-full flex items-center justify-center mb-5">
                        <Database className="w-10 h-10 text-[var(--text-muted)] opacity-50" />
                      </div>
                      <p className="font-bold text-[var(--text-muted)] text-[15px]">No custom providers configured</p>
                    </div>
                  </div>
                ) : (
                  apiProviders.map(provider => (
                    <div key={provider.id} className="bg-[var(--surface)] p-5 rounded-[1.5rem] border border-[var(--surface-border)] flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="font-bold text-[15px] text-[var(--text-primary)] truncate">{provider.name}</div>
                        <div className="text-[13px] text-blue-500 font-medium truncate mt-0.5">{provider.url}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingProviderId(provider.id); vibrate(); }} className={`p-2.5 rounded-xl transition-all ${editingProviderId === provider.id ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if(confirm('Delete provider?')) setApiProviders(p => p.filter(x => x.id !== provider.id)); }} className="p-2.5 bg-[var(--danger)]/10 text-[var(--danger)] rounded-xl active:bg-[var(--danger)] active:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
          <div className="absolute bottom-4 inset-x-4">
             <button onClick={() => setIsApiConfigOpen(false)} className="w-full bg-[var(--text-primary)] text-[var(--bg-main)] font-semibold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-transform text-[15px] flex items-center justify-center">
               Done
             </button>
          </div>
        </div>
      )}

      {isCustomModelsOpen && (
        <div className="fixed inset-0 bg-[var(--bg-main)] z-[150] flex flex-col pt-[max(env(safe-area-inset-top),8px)] pb-[max(env(safe-area-inset-bottom),8px)] animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-5 pb-4">
            <div className="flex items-center gap-1">
              <button onClick={() => { setIsCustomModelsOpen(false); setEditingModelId(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] mr-2 p-1">
                <X className="w-6 h-6" />
              </button>
              <nav className="flex items-center font-medium tracking-tight mt-0.5">
                <span 
                  onClick={() => { setIsCustomModelsOpen(false); setIsAiConfigOpen(true); setEditingModelId(null); vibrate(); }}
                  className="cursor-pointer text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Intelligence
                </span>
                <ChevronRight className="w-3 h-3 mx-1 text-[var(--text-muted)] opacity-50" />
                <span className="text-[11px] text-[var(--text-primary)]">Custom Models</span>
              </nav>
            </div>
            <div className="opacity-10 dark:opacity-20 text-[var(--text-primary)] mt-2">
              <Cpu className="w-10 h-10" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 pb-24">
            <section className="mx-5 mb-6">
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest uppercase mb-4 pl-1">{editingModelId ? 'Edit Model' : 'Add New Model'}</h3>
              <form className="space-y-4 p-5 bg-[var(--surface-variant)] border border-[var(--surface-border)] rounded-[1.5rem] shadow-sm" onSubmit={(e) => {
                e.preventDefault();
                vibrate();
                const fd = new FormData(e.currentTarget);
                const modelId = fd.get('modelId') as string;
                const displayName = fd.get('displayName') as string || modelId;
                const providerId = fd.get('providerId') as string;
                const censoredMode = fd.get('censoredMode') === 'true';
                if (!modelId || !providerId) { showToast('Model ID and Provider required'); return; }
                
                if (editingModelId) {
                  setCustomModels(p => p.map(x => x.id === editingModelId ? { ...x, modelId, displayName, providerId, censoredMode } : x));
                  setEditingModelId(null);
                  showToast('Model updated');
                } else {
                  setCustomModels(p => [...p, { id: Date.now().toString(), modelId, displayName, providerId, censoredMode, caps: { vision: true, audio: false, video: false, context: '128k', speed: 'standard' } }]);
                  showToast('Model added');
                }
                (e.target as HTMLFormElement).reset();
              }}>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-2">Model ID</label>
                  <input name="modelId" defaultValue={editingModelId ? customModels.find(m => m.id === editingModelId)?.modelId : ''} placeholder="e.g. google/gemini-2.5-flash" className="w-full p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none text-[var(--text-primary)] transition-all font-medium" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-2">Display Name</label>
                  <input name="displayName" defaultValue={editingModelId ? customModels.find(m => m.id === editingModelId)?.displayName : ''} placeholder="My Gemini" className="w-full p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none text-[var(--text-primary)] transition-all font-medium" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-2">API Provider</label>
                  <div className="relative">
                    <select name="providerId" defaultValue={editingModelId ? customModels.find(m => m.id === editingModelId)?.providerId : ''} className="w-full p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none appearance-none text-[var(--text-primary)] transition-all font-medium" required>
                      <option value="" disabled>Select API Provider</option>
                      {apiProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-2">Content Filter</label>
                  <div className="relative">
                    <select name="censoredMode" defaultValue={editingModelId ? (customModels.find(m => m.id === editingModelId)?.censoredMode ? 'true' : 'false') : 'false'} className="w-full p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none appearance-none text-[var(--text-primary)] transition-all font-medium">
                      <option value="false">Off (Standard)</option>
                      <option value="true">On (Filtered)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  {editingModelId && (
                    <button type="button" onClick={() => setEditingModelId(null)} className="flex-1 bg-[var(--surface-variant)] border border-[var(--surface-border)] text-[var(--text-primary)] py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform">Cancel</button>
                  )}
                  <button type="submit" className="flex-[2] bg-[var(--accent)] text-white py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform shadow-md">{editingModelId ? 'Update Model' : 'Add Model'}</button>
                </div>
              </form>
            </section>

            <section className="mx-5">
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 pl-1">Custom Models ({customModels.length})</h3>
              <div className="space-y-3">
                {customModels.length === 0 ? (
                  <div className="mx-0 bg-[var(--surface-variant)] border border-[var(--surface-border)] rounded-[1.5rem] p-8 shadow-[0_0_15px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-20 h-20 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-full flex items-center justify-center mb-5">
                        <Cpu className="w-10 h-10 text-[var(--text-muted)] opacity-50" />
                      </div>
                      <p className="font-bold text-[var(--text-muted)] text-[15px]">No custom models added</p>
                    </div>
                  </div>
                ) : (
                  customModels.map(model => (
                    <div key={model.id} className="bg-[var(--surface)] p-5 rounded-[1.5rem] border border-[var(--surface-border)] flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="font-bold text-[15px] text-[var(--text-primary)] truncate">{model.displayName}</div>
                        <div className="text-[13px] text-purple-500 font-medium truncate mt-0.5">{model.modelId}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingModelId(model.id); vibrate(); }} className={`p-2.5 rounded-xl transition-all ${editingModelId === model.id ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if(confirm('Delete model?')) setCustomModels(p => p.filter(x => x.id !== model.id)); }} className="p-2.5 bg-[var(--danger)]/10 text-[var(--danger)] rounded-xl active:bg-[var(--danger)] active:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
          <div className="absolute bottom-4 inset-x-4">
             <button onClick={() => setIsCustomModelsOpen(false)} className="w-full bg-[var(--text-primary)] text-[var(--bg-main)] font-semibold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-transform text-[15px] flex items-center justify-center">
               Done
             </button>
          </div>
        </div>
      )}

      <ModelSelector 
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        models={[...BUILT_IN_MODELS, ...customModels]}
        selectedModelId={settings.selectedModelId}
        onSelect={(id) => { setSettings(p => ({ ...p, selectedModelId: id })); vibrate(); }}
        detectedCaps={detectedCaps}
      />

      {/* Main App */}
      <div id="main-content" className="flex-1 flex flex-col w-full h-full relative z-10 pt-[max(env(safe-area-inset-top),4px)] pb-[max(env(safe-area-inset-bottom),4px)] overflow-hidden">
        <ChatHeader 
          onMenuClick={() => { setIsDrawerOpen(true); vibrate(); }}
          onModelSelectorClick={() => { setIsModelSelectorOpen(true); vibrate(); }}
          onNewChatClick={handleCreateSession}
          onExportClick={(type) => {
            if (type === 'pdf') exportToPDF();
            else if (type === 'md') exportToMarkdown();
            else if (type === 'json') exportToJSON();
            else if (type === 'clear') { if (currentSession) clearSessionMessages(currentSession.id); }
          }}
          selectedModelName={customModels.find(m => m.id === settings.selectedModelId)?.displayName || BUILT_IN_MODELS.find(m => m.id === settings.selectedModelId)?.displayName || 'Select Model'}
          isExportMenuOpen={isExportMenuOpen}
          setIsExportMenuOpen={setIsExportMenuOpen}
        />

        <div id="chat-messages-container" ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-2 scroll-smooth no-scrollbar select-text pb-4">
          <div className="w-full pt-2">
            {!currentSession.messages.length ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] space-y-8 pt-10">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center p-6 bg-[var(--surface-variant)]/30 rounded-[40px]"
                >
                  <BrandLogo className="w-20 h-20 text-[var(--logo-color)] drop-shadow-lg" />
                </motion.div>
                <div className="flex flex-col items-center space-y-2">
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05, duration: 0.25 }}
                    className="font-serif text-3xl text-[var(--text-primary)] font-semibold"
                  >
                    {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
                  </motion.p>
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    className="text-[var(--text-muted)] text-base"
                  >
                    How can I help you today?
                  </motion.p>
                </div>
              </div>
            ) : (
              currentSession.messages.map((message) => (
                <div key={message.id} className={`flex flex-col mb-6 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2.5 mb-2 px-1">
                      <div className="flex items-center justify-center shrink-0"><BrandLogo className="w-6 h-6 text-[var(--logo-color)]" /></div>
                    <div className="flex flex-col gap-1.5 overflow-hidden min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[14px] text-[var(--text-primary)] truncate">{message.modelName || 'DROIDE'}</span>
                        <Info className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-50 cursor-help" />
                        {message.startTime && message.endTime && (
                          <div className="flex items-center gap-1 text-[var(--text-muted)] text-[12px] shrink-0">
                            <span>•</span>
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>{Math.max(1, Math.floor((message.endTime - message.startTime) / 1000))}s</span>
                          </div>
                        )}
                        <button onClick={() => speakText(message.content, message.id)} className="p-1 hover:bg-[var(--surface-hover)] rounded-full transition-colors shrink-0">
                          {isSpeakingId === message.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-[var(--accent)]" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-70" />
                          )}
                        </button>
                      </div>
                    </div>
                    </div>
                  )}
                  
                  <div className={`relative text-base leading-[1.6] selectable-text w-full
                    ${message.role === 'user' 
                      ? (message.id === editingMessageId 
                        ? 'bg-[var(--bubble-user)] border border-[var(--accent)] rounded-2xl sm:w-[500px] ml-auto px-4 py-3' 
                        : 'bg-[var(--bubble-user)] text-[var(--text-primary)] rounded-2xl max-w-[85%] ml-auto px-4 py-3 border border-[var(--surface-border)]') 
                      : 'text-[var(--text-secondary)] w-full px-1 py-2'}`}>
                    
                    {message.edits && message.edits.length > 0 && (
                       <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-2">
                         <span>Version:</span>
                         <select 
                            value={messageVersions[message.id] || 0}
                            onChange={(e) => setMessageVersions(prev => ({...prev, [message.id]: parseInt(e.target.value)}))}
                            className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded px-1"
                         >
                           <option value={0}>Original</option>
                           {message.edits.map((_, i) => <option key={i} value={i + 1}>v{i + 1}</option>)}
                         </select>
                       </div>
                    )}
                    {message.images && message.images.length > 0 && message.id !== editingMessageId && (
                      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                        {message.images.map((img, i) => (
                          <div key={i} className="flex-shrink-0">
                            {img.mimeType.startsWith('image/') || (img as any).isUrl ? (
                              <img src={(img as any).isUrl ? img.data : `data:${img.mimeType};base64,${img.data}`} alt="upload" className="w-40 h-40 object-cover rounded-xl border border-[var(--surface-border)] shadow-sm" />
                            ) : (
                              <div className="w-40 h-40 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-variant)] flex items-center justify-center p-8">
                                <div className="w-16 h-16 text-[var(--text-secondary)]">
                                  {getFileIcon((img as any).name || 'file', img.mimeType)}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div 
                      className={message.role === 'assistant' ? 'prose dark:prose-invert max-w-none prose-p:my-2 prose-headings:mb-3 prose-headings:mt-6 text-[var(--text-secondary)] break-words w-full overflow-x-hidden' : 'whitespace-pre-wrap break-words'}
                      style={{ 
                        fontFamily: getChatFontFamily(), 
                        fontSize: settings.chatFontSize ? `${settings.chatFontSize}px` : '15px',
                        lineHeight: 1.6
                      }}
                    >
                      {message.role === 'assistant' ? (
                        (!message.content && message.isStreaming) ? (
                          <div className="space-y-4">
                            <ThinkingIndicator startTime={message.startTime} activeTool={activeTool} />
                            <MessageSkeleton />
                          </div>
                        ) : (
                          <Markdown 
                            remarkPlugins={[remarkGfm]}
                            components={{ 
                              p: ({children}) => <div className="mb-4 last:mb-0">{children}</div>,
                              code({node, inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : '';
                                const value = String(children).replace(/\n$/, '');
                                
                                if (!inline && settings.artifactsEnabled && ['html', 'mermaid', 'svg', 'javascript', 'js'].includes(language)) {
                                  return <ArtifactViewer code={value} language={language} />;
                                }

                                return !inline ? (
                                  <CodeBlock language={language} value={value} />
                                ) : (
                                  <code className={`${className} bg-black/5 px-1.5 py-0.5 rounded text-[var(--text-primary)] font-mono text-sm`} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              table({ children }) {
                                return <div className="overflow-x-auto my-4 border border-[var(--surface-border)] rounded-xl"><table className="w-full border-collapse text-left text-sm">{children}</table></div>
                              },
                              th({ children }) {
                                return <th className="bg-[var(--surface)] text-[var(--text-muted)] font-bold px-4 py-3 border-b border-[var(--surface-border)]">{children}</th>
                              },
                              td({ children }) {
                                return <td className="px-4 py-3 border-b border-[var(--surface-border)] text-[var(--text-primary)]">{children}</td>
                              }
                            }}
                          >
                            {((messageVersions[message.id] || 0) === 0 ? message.content : message.edits![messageVersions[message.id]! - 1].content)?.replace(/<Artifact[^>]*>/gi, '')?.replace(/<\/Artifact>/gi, '')}
                          </Markdown>
                        )
                      ) : (
                        message.id === editingMessageId ? (
                          <div className="flex flex-col gap-3 py-1">
                            <textarea
                              value={editingMessageText}
                              onChange={(e) => {
                                setEditingMessageText(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none p-0 text-base text-[var(--text-primary)] leading-relaxed min-h-[60px] no-scrollbar"
                              style={{ caretColor: 'var(--caret-color)' }}
                              autoFocus
                              onFocus={(e) => {
                                const val = e.target.value;
                                e.target.value = '';
                                e.target.value = val;
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                            />
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--surface-border)]">
                              <button onClick={handleCancelEdit} className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1">Cancel</button>
                              <button onClick={() => handleSaveEdit(message.id)} className="text-sm font-bold bg-[var(--text-primary)] text-[var(--bg-main)] px-4 py-1.5 rounded-lg active:scale-95 transition-transform shadow-sm">Save & Submit</button>
                            </div>
                          </div>
                        ) : (
                          (messageVersions[message.id] || 0) === 0 
                            ? message.content 
                            : message.edits![messageVersions[message.id]! - 1].content
                        )
                      )}
                    </div>

                    {(message.isStreaming && message.content) && <span className="inline-block w-2.5 h-4 bg-[var(--accent)] animate-pulse ml-1 align-middle rounded-sm" />}
                  </div>

                  {/* Feature 3, 4, 6, 7, 12, 13, 18: Message interaction toolbar */}
                  {!message.isStreaming && message.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-2 text-[var(--text-muted)]">
                      <button onClick={() => handleCopy(message.content)} className="p-2 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => forkSession(currentSession.id, message.id)} className="p-2 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"><GitFork className="w-4 h-4" /></button>
                      <button onClick={() => handleShare(message.content)} className="p-2 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"><Share className="w-4 h-4" /></button>
                      <button onClick={() => speakText(message.content, message.id)} className="p-2 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors">
                        {isSpeakingId === message.id ? <VolumeX className="w-4 h-4 text-[var(--accent)]" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <button onClick={handleRegenerate} className="p-2 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"><RefreshCcw className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteMsg(message.id)} className="p-2 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                  {message.role === 'user' && message.id !== editingMessageId && (
                    <div className="flex items-center gap-1 mt-1 text-[var(--text-muted)] mr-1">
                      <button onClick={() => handleCopy(message.content)} className="p-1.5 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleEdit(message)} className="p-1.5 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-full"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => forkSession(currentSession.id, message.id)} className="p-1.5 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-full"><GitFork className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteMsg(message.id)} className="p-1.5 hover:text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              ))
            )}
            {errorText === 'API_KEY_ERROR' ? (
              <div className="flex items-center justify-center gap-2 text-[var(--danger)] font-medium my-4 px-4 py-3 bg-[var(--danger)]/5 rounded-2xl border border-[var(--danger)]/10">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-sm">API Key not configured. Please check your settings.</span>
                <AlertTriangle className="w-5 h-5 shrink-0" />
              </div>
            ) : errorText && (
              <div className="text-sm text-[var(--danger)] text-center my-4 px-4">{errorText}</div>
            )}
          </div>
        </div>

        <ChatInput 
          inputText={inputText}
          setInputText={setInputText}
          onSend={handleSend}
          onStop={handleStop}
          onVoice={handleVoice}
          onFileClick={() => { vibrate(); fileInputRef.current?.click(); }}
          onOpenPromptLibrary={() => { vibrate(); setIsPromptLibraryOpen(true); }}
          isGenerating={isGenerating}
          pendingImages={pendingImages}
          removePendingImage={(i) => setPendingImages(prev => prev.filter((_, idx) => idx !== i))}
          inputRef={inputRef}
          handleKeyDown={handleKeyDown}
          wordCount={wordCount}
          discoveryEnabled={settings.discoveryEnabled}
          onToggleDiscovery={() => { vibrate(); setSettings(prev => ({ ...prev, discoveryEnabled: !prev.discoveryEnabled })); }}
          adaptiveThinking={settings.adaptiveThinking}
          onToggleAdaptiveThinking={() => { vibrate(); setSettings(prev => ({ ...prev, adaptiveThinking: !prev.adaptiveThinking })); }}
          generateMemory={settings.generateMemory}
          onToggleMemory={() => { vibrate(); setSettings(prev => ({ ...prev, generateMemory: !prev.generateMemory })); }}
          caretStyle={settings.caretStyle}
        />
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
      </div>
      {/* Mic Permission Prompt */}
      <AnimatePresence mode="wait">
        {showMicPrompt && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[var(--bg-main)] w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-[var(--surface-border)]"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">Voice Dictation</h3>
              <p className="text-[var(--text-muted)] text-center text-sm mb-6 leading-relaxed">
                DROIDE needs microphone access to convert your speech to text. Your voice is processed locally and used only for this message.
              </p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { setShowMicPrompt(false); startVoiceDictation(); }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold android-ripple"
                >
                  Enable Microphone
                </button>
                <button 
                  onClick={() => setShowMicPrompt(false)}
                  className="w-full py-4 bg-[var(--surface)] text-[var(--text-primary)] rounded-2xl font-bold android-ripple"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folder Manager Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-main)] rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1 text-[var(--text-primary)]">{editingFolderId ? 'Edit Folder' : 'New Folder'}</h3>
              <p className="text-[var(--text-secondary)] mb-6 text-sm">Organize your chats with custom categories.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Folder Name</label>
                  <input 
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="e.g., Coding, Homework, Personal"
                    className="w-full p-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
                    autoFocus
                    onKeyDown={(e) => { if(e.key === 'Enter') handleCreateFolder(); }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 bg-[var(--surface)] border-t border-[var(--surface-border)]">
              <button 
                onClick={() => { setIsFolderModalOpen(false); setEditingFolderId(null); setNewFolderName(''); }} 
                className="px-4 py-2 rounded-lg font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFolder}
                className="px-6 py-2 rounded-lg font-bold bg-[var(--accent)] text-white active:scale-95 transition-transform shadow-md"
              >
                {editingFolderId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PromptLibraryModal 
        isOpen={isPromptLibraryOpen}
        onClose={() => { setIsPromptLibraryOpen(false); setEditingPromptId(null); setNewPromptName(''); setNewPromptContent(''); }}
        prompts={savedPrompts}
        onSavePrompt={() => handleSavePrompt()}
        onDeletePrompt={deletePrompt}
        onUsePrompt={(content) => { usePrompt(content); vibrate(); }}
        onSetPersona={(content) => { 
          setSettings(p => ({...p, systemPrompt: content})); 
          showToast('Persona successfully applied to System Settings');
          setIsPromptLibraryOpen(false);
          vibrate();
        }}
        editingPromptId={editingPromptId}
        setEditingPromptId={setEditingPromptId}
        newPromptName={newPromptName}
        setNewPromptName={setNewPromptName}
        newPromptContent={newPromptContent}
        setNewPromptContent={setNewPromptContent}
      />

      <ScrollToBottomFAB 
        isVisible={showScrollFAB} 
        onClick={() => {
          scrollToBottom();
          vibrate();
        }} 
      />
    </div>
  );
}
