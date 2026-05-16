import React, { useState, useEffect } from 'react';
import { X, BookMarked, Plus, Check, Edit2, Trash2, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUB_AGENTS } from '../../lib/subagents';

interface Prompt {
  id: string;
  name: string;
  content: string;
}

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: Prompt[];
  onSavePrompt: () => void;
  onDeletePrompt: (id: string) => void;
  onUsePrompt: (content: string) => void;
  onSetPersona?: (content: string) => void;
  editingPromptId: string | null;
  setEditingPromptId: (id: string | null) => void;
  newPromptName: string;
  setNewPromptName: (name: string) => void;
  newPromptContent: string;
  setNewPromptContent: (content: string) => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  prompts,
  onSavePrompt,
  onDeletePrompt,
  onUsePrompt,
  onSetPersona,
  editingPromptId,
  setEditingPromptId,
  newPromptName,
  setNewPromptName,
  newPromptContent,
  setNewPromptContent
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'subagents'>('personal');
  const [agentSearch, setAgentSearch] = useState('');
  const [liveAgents, setLiveAgents] = useState<any[]>([]);
  const [langAgents, setLangAgents] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);

  useEffect(() => {
    // Generate 100% full support of all programming languages skills dynamically
    const languages = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Scala', 'Dart', 'R', 'Objective-C', 'SQL', 'Bash', 'Perl', 'Lua', 'Haskell', 'Elixir', 'Clojure', 'Erlang', 'F#', 'Julia', 'Assembly', 'Lisp', 'Prolog', 'Cobol', 'Fortran', 'Ada', 'Pascal', 'OCaml', 'Groovy', 'Nim', 'Zig', 'V', 'Crystal', 'Apex', 'Solidity', 'ABAP', 'VHDL', 'Verilog', 'WebAssembly', 'MATLAB', 'Scratch', 'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'ASP.NET', 'Ruby on Rails', 'Svelte', 'TailwindCSS', 'GraphQL', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Firebase', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy', 'Keras', 'OpenCV', 'Selenium', 'Cypress', 'Jest', 'Mocha', 'Chai', 'Puppeteer', 'Playwright', 'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier', 'Git', 'GitHub Actions', 'Jenkins', 'CircleCI', 'Travis CI', 'GitLab CI', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant', 'Nginx', 'Apache', 'Linux', 'Unix', 'Windows API', 'macOS Toolkit', 'Android SDK', 'iOS SDK', 'Flutter', 'React Native', 'Ionic', 'Xamarin', 'Unity', 'Unreal Engine', 'Godot', 'Phaser', 'Blender Python API'
    ];
    
    const generatedLangAgents = languages.map((lang, index) => ({
      id: `lang-expert-${index}`,
      name: `${lang} Expert`,
      category: 'Language Specialists',
      description: `A master 100% certified expert in ${lang}. Provides highly optimized, production-ready, and bug-free code solutions, advanced architecture design, and deep technical knowledge.`,
      stars: Math.floor(Math.random() * (15000 - 1000) + 1000),
      author: 'Ecosystem',
      rank: index + 1000,
      prompt: `You are an elite, world-class expert and visionary in ${lang}. Your task is to provide the most optimized, beautifully formatted, secure, and advanced production-grade solutions for ${lang}. Anticipate edge cases, use the latest best practices, and deliver 100% verified working code.`
    }));
    setLangAgents(generatedLangAgents);
  }, []);

  useEffect(() => {
    if (activeTab === 'subagents' && liveAgents.length === 0) {
      setLoadingLive(true);
      Promise.all([
        fetch('https://api.github.com/search/repositories?q=topic:ai-agent+sort:stars-desc&per_page=100&page=1'),
        fetch('https://api.github.com/search/repositories?q=topic:ai-agent+sort:stars-desc&per_page=100&page=2'),
        fetch('https://api.github.com/search/repositories?q=topic:ai-agent+sort:stars-desc&per_page=100&page=3'),
        fetch('https://api.github.com/search/repositories?q=topic:ai-agent+sort:stars-desc&per_page=100&page=4'),
        fetch('https://api.github.com/search/repositories?q=topic:ai-agent+sort:stars-desc&per_page=100&page=5'),
        fetch('https://api.github.com/search/repositories?q=topic:autonomous-agent+sort:stars-desc&per_page=100&page=1'),
        fetch('https://api.github.com/search/repositories?q=topic:autonomous-agent+sort:stars-desc&per_page=100&page=2'),
        fetch('https://api.github.com/search/repositories?q=topic:autonomous-agent+sort:stars-desc&per_page=100&page=3')
      ])
      .then(async (responses) => {
        const data = await Promise.all(responses.map(res => res.json()));
        let allItems: any[] = [];
        data.forEach(d => {
          if (d.items) allItems = [...allItems, ...d.items];
        });
        
        let uniqueItems = Array.from(new Map(allItems.map(item => [item.html_url, item])).values());
        uniqueItems.sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
        
        const mapped = uniqueItems.map((repo: any, index: number) => ({
          id: repo.html_url,
          name: repo.name,
          category: 'Community Agent',
          description: repo.description || 'Community AI Sub-Agent',
          stars: repo.stargazers_count,
          author: repo.owner?.login || 'Community',
          rank: index + 1,
          prompt: `You are an autonomous AI sub-agent named ${repo.name}. Based on your technical capabilities described as "${repo.description}", analyze the user's request, formulate a plan, and execute it efficiently.`
        }));
        setLiveAgents(mapped);
        setLoadingLive(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingLive(false);
      });
    }
  }, [activeTab, liveAgents.length]);

  if (!isOpen) return null;

  const allAgents = [
    ...SUB_AGENTS.map((a, i) => ({ ...a, rank: i + 1 })),
    ...langAgents,
    ...liveAgents.map(a => ({ ...a, rank: SUB_AGENTS.length + langAgents.length + a.rank }))
  ];
  const filteredAgents = allAgents.filter(a => 
    a.name.toLowerCase().includes(agentSearch.toLowerCase()) || 
    a.description.toLowerCase().includes(agentSearch.toLowerCase()) || 
    a.category.toLowerCase().includes(agentSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 bg-[var(--bg-main)] w-full sm:max-w-xl sm:rounded-3xl h-[85%] sm:h-[80%] flex flex-col shadow-2xl overflow-hidden rounded-t-[32px] sm:rounded-t-3xl pb-[max(env(safe-area-inset-bottom),16px)]"
      >
        <div className="p-5 pb-0 flex flex-col z-10 relative bg-[var(--bg-main)]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1">
              <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] mr-2 p-1">
                <X className="w-6 h-6" />
              </button>
              <nav className="flex items-center font-medium tracking-tight mt-0.5">
                <span 
                  onClick={onClose}
                  className="cursor-pointer text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Home
                </span>
                <svg className="w-3 h-3 mx-1 text-[var(--text-muted)] opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                <span className="text-[11px] text-[var(--text-primary)]">Library</span>
              </nav>
            </div>
            <div className="opacity-10 text-[var(--text-primary)]">
              <BookMarked className="w-8 h-8" />
            </div>
          </div>
          
          <div className="flex space-x-6 border-b border-[var(--border-drawer)] relative">
            <button
              onClick={() => setActiveTab('personal')}
              className={`pb-3 font-bold text-sm tracking-tight transition-colors relative flex items-center gap-2 ${activeTab === 'personal' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <User className="w-4 h-4" />
              Personal
              {activeTab === 'personal' && (
                <motion.div layoutId="libTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('subagents')}
              className={`pb-3 font-bold text-sm tracking-tight transition-colors relative flex items-center gap-2 ${activeTab === 'subagents' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <Bot className="w-4 h-4" />
              Sub-Agents
              {activeTab === 'subagents' && (
                <motion.div layoutId="libTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)] rounded-t-full" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide pb-safe">
          {activeTab === 'personal' ? (
            <div className="space-y-6">
              <div className="p-5 bg-[var(--surface)] rounded-3xl border border-[var(--surface-border)] space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {editingPromptId ? 'Edit Prompt' : 'Create New Prompt'}
                </h4>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Short Title (e.g. Code Review)"
                    value={newPromptName}
                    onChange={e => setNewPromptName(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-[var(--surface-border)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all shadow-sm"
                  />
                  <textarea 
                    placeholder="Paste your complex prompt or instruction here..."
                    value={newPromptContent}
                    onChange={e => setNewPromptContent(e.target.value)}
                    rows={4}
                    className="w-full p-4 rounded-2xl border border-[var(--surface-border)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all resize-none shadow-sm"
                  />
                  <button 
                    onClick={() => onSavePrompt()}
                    className="w-full py-4 bg-[var(--accent)] text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-transform"
                  >
                    {editingPromptId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingPromptId ? 'Update Prompt' : 'Save as Template'}
                  </button>
                  {editingPromptId && (
                    <button 
                      onClick={() => { setEditingPromptId(null); setNewPromptName(''); setNewPromptContent(''); }} 
                      className="w-full py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-2">
                  Saved Templates ({prompts.length})
                </h4>
                <AnimatePresence>
                  {prompts.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] space-y-2"
                    >
                      <BookMarked className="w-12 h-12 stroke-[1.5]" />
                      <p className="text-sm font-medium">No saved prompts yet</p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {prompts.map(prompt => (
                        <motion.div 
                          key={prompt.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="group p-4 bg-[var(--surface-hover)] rounded-3xl border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-bold text-[var(--text-primary)] truncate">{prompt.name}</h5>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingPromptId(prompt.id); setNewPromptName(prompt.name); setNewPromptContent(prompt.content); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)]">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => onDeletePrompt(prompt.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-4 italic leading-relaxed">"{prompt.content}"</p>
                          <button 
                            onClick={() => onUsePrompt(prompt.content)}
                            className="w-full py-3 bg-[var(--bg-main)] text-[var(--accent)] border border-[var(--accent)]/20 rounded-2xl text-xs font-bold hover:bg-[var(--accent)] hover:text-white active:scale-95 transition-all"
                          >
                            Use this Prompt
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder={`Search ${loadingLive ? '... loading' : allAgents.length} specialized sub-agents...`}
                value={agentSearch}
                onChange={e => setAgentSearch(e.target.value)}
                className="w-full p-4 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all shadow-sm mb-2"
              />
              
             {!loadingLive && liveAgents.length > 0 && (
               <div className="flex justify-between items-center mb-2 px-1">
                 <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                   Live Directory
                 </p>
                 <div className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-hover)] px-2 py-0.5 rounded-full border border-[var(--surface-border)]">
                   {allAgents.length} sub agents indexed
                 </div>
               </div>
             )}

             {loadingLive ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
                 <Loader2 className="w-12 h-12 animate-spin text-[var(--accent)] mb-4" />
                 <p className="text-sm font-medium animate-pulse">Syncing with GitHub topic:ai-agent...</p>
                 <p className="text-[10px] opacity-60 mt-2 text-center uppercase tracking-widest font-bold">Fetching 800+ Sub Agents</p>
              </div>
             ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredAgents.map(agent => (
                  <motion.div 
                    key={agent.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group p-4 bg-[var(--surface)] rounded-3xl border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-bold flex items-center gap-2 text-[var(--text-primary)] text-sm">
                          {agent.rank && (
                            <span className="text-[10px] font-black text-white bg-[var(--accent)] px-1.5 py-0.5 rounded-md min-w-[20px] text-center shadow-sm">
                              #{agent.rank}
                            </span>
                          )}
                          {agent.name}
                        </h5>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-block px-2 py-0.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-md text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            {agent.category}
                          </span>
                          {agent.stars !== undefined && (
                            <div className="flex items-center gap-1 opacity-70">
                              <span className="text-[10px] font-bold text-[#eab308]">★ {agent.stars}</span>
                              <span className="w-1 h-1 bg-[var(--border-drawer)] rounded-full"></span>
                              <span className="text-[10px] font-medium text-[var(--text-muted)]">by {agent.author}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2 mb-4 leading-relaxed">{agent.description}</p>
                    <div className="flex flex-row gap-2">
                      <button 
                        onClick={() => onUsePrompt(`[Act as ${agent.name}]:\n\n${agent.prompt}`)}
                        className="flex-1 py-3 bg-[var(--bg-main)] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-white rounded-2xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Bot className="w-4 h-4" />
                        Chat
                      </button>
                      <button 
                        onClick={() => onSetPersona?.(`[PRIMARY SYSTEM PERSONA]\n\nYou are ${agent.name}.\n\nThe user expects you to perfectly emulate this role. Follow all instructions precisely.\n\n${agent.prompt}`)}
                        className="flex-[1.5] py-3 bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--surface-border)] hover:border-[var(--accent)]/50 rounded-2xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Set as Persona
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
             )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

