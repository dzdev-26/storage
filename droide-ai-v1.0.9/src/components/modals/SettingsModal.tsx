import React from 'react';
import { X, Settings as SettingsIcon, Shield, Sparkles, Link2, Monitor, Sun, Moon, FileOutput, GitFork } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../../types';
import { POPULAR_FONTS } from '../../constants/fonts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  settingsTab: 'general' | 'privacy' | 'capabilities' | 'connectors' | 'ai-requirements';
  setSettingsTab: (tab: 'general' | 'privacy' | 'capabilities' | 'connectors' | 'ai-requirements') => void;
  vibrate: (ms?: number) => void;
  onExportData?: () => void;
  onManageMemories?: () => void;
  onManageSharedChats?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
  settingsTab,
  setSettingsTab,
  vibrate,
  onExportData,
  onManageMemories,
  onManageSharedChats
}) => {
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [isConfirmingClearCache, setIsConfirmingClearCache] = React.useState(false);

  if (!isOpen) return null;

  const handleClearCache = () => {
    if (!isConfirmingClearCache) {
      setIsConfirmingClearCache(true);
      vibrate(50);
      setTimeout(() => setIsConfirmingClearCache(false), 4000);
      return;
    }
    localStorage.removeItem('droide_settings');
    window.location.reload();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(p => ({ ...p, avatarUrl: reader.result as string }));
        vibrate(50);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveRequirement = (id: string) => {
    setSettings(prev => ({
      ...prev,
      aiRequirements: (prev.aiRequirements || []).filter(r => r.id !== id)
    }));
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-main)] z-[150] flex flex-col pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] animate-in fade-in duration-200">
      <input 
        type="file" 
        ref={avatarInputRef} 
        onChange={handleAvatarChange} 
        accept="image/*" 
        className="hidden" 
      />
      <div className="flex items-center px-4 py-2 border-b border-[var(--border-drawer)]">
        <button onClick={onClose} className="p-2 mr-2 hover:bg-[var(--surface-hover)] active:bg-[var(--surface-hover)] rounded-full transition-colors">
          <X className="w-6 h-6 text-[var(--text-primary)]" />
        </button>
        <nav className="flex items-center text-xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
          <span 
            className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            onClick={onClose}
          >
            Home
          </span>
          <svg className="w-5 h-5 mx-2 text-[var(--text-muted)] opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          <span>Settings</span>
        </nav>
      </div>

      <div className="flex items-center overflow-x-auto no-scrollbar border-b border-[var(--border-drawer)] px-2 bg-[var(--bg-main)] sticky top-0 z-10">
        {[
          { id: 'general', label: 'General', icon: SettingsIcon },
          { id: 'privacy', label: 'Privacy', icon: Shield },
          { id: 'capabilities', label: 'Capabilities', icon: Sparkles },
          { id: 'connectors', label: 'Connectors', icon: Link2 },
          { id: 'ai-requirements', label: 'AI REQUIREMENTS', icon: GitFork },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setSettingsTab(tab.id as any); vibrate(); }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium
              ${settingsTab === tab.id 
                ? 'border-[var(--accent)] text-[var(--accent)]' 
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {settingsTab === 'general' && (
          <div className="p-6 space-y-8 max-w-2xl mx-auto">
            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Profile</h3>
              <div className="flex items-center gap-4 mb-6">
                <div 
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-16 h-16 rounded-full bg-[var(--surface-hover)] border border-[var(--surface-border)] flex items-center justify-center text-xl font-bold text-[var(--accent)] shadow-inner overflow-hidden cursor-pointer active:scale-95 transition-transform"
                >
                  {settings.avatarUrl ? (
                    <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    settings.fullName?.charAt(0) || 'D'
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Avatar</p>
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-xs text-[var(--accent)] font-medium mt-1"
                  >
                    Change photo
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">Full name</label>
                  <input 
                    type="text" 
                    value={settings.fullName || ''} 
                    onChange={e => setSettings(p => ({...p, fullName: e.target.value}))}
                    className="w-full p-3.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-2xl text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">What should DROIDE call you?</label>
                  <input 
                    type="text" 
                    value={settings.nickname || ''} 
                    onChange={e => setSettings(p => ({...p, nickname: e.target.value}))}
                    className="w-full p-3.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-2xl text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">Work Description</label>
                  <input 
                    type="text" 
                    value={settings.workDescription || ''} 
                    onChange={e => setSettings(p => ({...p, workDescription: e.target.value}))}
                    className="w-full p-3.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-2xl text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Appearance</span>
                  <div className="flex bg-[var(--surface-hover)] rounded-full p-1 border border-[var(--surface-border)] shadow-sm">
                    {[
                      { id: 'system', icon: Monitor },
                      { id: 'light', icon: Sun },
                      { id: 'dark', icon: Moon },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setSettings(p => ({...p, theme: t.id as any})); vibrate(); }}
                        className={`p-2 rounded-full transition-all ${settings.theme === t.id ? 'bg-white shadow-md text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
                      >
                        <t.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">App font</span>
                  <select 
                    value={settings.chatFont || 'DROIDE Serif'} 
                    onChange={e => setSettings(p => ({...p, chatFont: e.target.value}))}
                    className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none max-w-[200px] truncate"
                  >
                    <option value="DROIDE Serif">DROIDE Serif</option>
                    <option value="Inter Sans">Inter Sans</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option disabled>──────────</option>
                    {Array.from(new Set(POPULAR_FONTS)).map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Cursor Style</span>
                  <select 
                    value={settings.caretStyle || 'bar'} 
                    onChange={e => setSettings(p => ({...p, caretStyle: e.target.value as any}))}
                    className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none min-w-[120px]"
                  >
                    <option value="bar">Bar ( | )</option>
                    <option value="underscore">Underscore ( _ )</option>
                    <option value="block">Block ( █ )</option>
                    <option value="dot">Dot ( • )</option>
                    <option value="slash">Slash ( / )</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Stream responses</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Show text chunk-by-chunk</p>
                  </div>
                  <button 
                    onClick={() => setSettings(p => ({...p, streamResponses: !p.streamResponses}))} 
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.streamResponses ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.streamResponses ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Auto TTS</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Read responses automatically</p>
                  </div>
                  <button 
                    onClick={() => setSettings(p => ({...p, autoTts: !p.autoTts}))} 
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.autoTts ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.autoTts ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Force Bengali</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Always translate replies to Bengali</p>
                  </div>
                  <button 
                    onClick={() => setSettings(p => ({...p, forceBengali: !p.forceBengali}))} 
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.forceBengali ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.forceBengali ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
              </div>
            </section>


          </div>
        )}

        {settingsTab === 'privacy' && (
          <div className="p-6 space-y-8 max-w-2xl mx-auto">
            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Improve DROIDE for everyone</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">Allow DROIDE to use your messages to train its AI models. <span className="text-[var(--accent)] underline">Learn more.</span></p>
                  </div>
                  <button 
                    onClick={() => {
                      setSettings(p => ({...p, improveDroide: !p.improveDroide}));
                      vibrate(50);
                    }} 
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.improveDroide ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.improveDroide ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Location metadata</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">Allow DROIDE to use coarse location metadata (city/region) to improve product experiences. <span className="text-[var(--accent)] underline">Learn more.</span></p>
                  </div>
                  <button 
                    onClick={() => {
                      setSettings(p => ({...p, locationMetadata: !p.locationMetadata}));
                      vibrate(50);
                    }} 
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.locationMetadata ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.locationMetadata ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Your data</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-4">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Export data</span>
                  <button 
                    onClick={onExportData}
                    className="px-4 py-1.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-xs font-bold active:scale-95 transition-transform"
                  >
                    Export data
                  </button>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-4">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Shared chats</span>
                  <button 
                    onClick={onManageSharedChats}
                    className="px-4 py-1.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-xs font-bold active:scale-95 transition-transform"
                  >
                    Manage
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Memory preferences</span>
                  <button 
                    onClick={onManageMemories}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-xs font-bold active:scale-95 transition-transform"
                  >
                    Manage <FileOutput className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {settingsTab === 'capabilities' && (
          <div className="p-6 space-y-8 max-w-2xl mx-auto">
            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Memory</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Generate memory from chat history</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Allow DROIDE to remember relevant context from your chats. Memory includes your entire chat history with DROIDE. <span className="text-[var(--accent)] underline">Learn more.</span></p>
                  </div>
                  <button 
                    onClick={() => setSettings(p => ({...p, generateMemory: !p.generateMemory}))} 
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.generateMemory ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.generateMemory ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div className="space-y-6">
                <div>
                   <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">System Prompt</label>
                   <textarea 
                     value={settings.systemPrompt || ''} 
                     onChange={e => setSettings(p => ({...p, systemPrompt: e.target.value}))}
                     placeholder="Global system prompt for all conversations..."
                     rows={4}
                     className="w-full p-3.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-2xl text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-[var(--accent)] outline-none resize-none font-mono text-[11px] leading-relaxed"
                   />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">General</h3>
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Tool access mode</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Controls how connector tools are loaded in new conversations.</p>
                </div>
                <select 
                  value={settings.toolAccessMode || 'needed'} 
                  onChange={e => setSettings(p => ({...p, toolAccessMode: e.target.value as any}))}
                  className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none min-w-[150px]"
                >
                  <option value="needed">Load tools when needed</option>
                  <option value="always">Always load tools</option>
                  <option value="never">Never load tools</option>
                </select>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Visuals</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Artifacts</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Generate code, documents, and designs in a dedicated window alongside your conversation.</p>
                  </div>
                  <button 
                    onClick={() => setSettings(p => ({...p, artifactsEnabled: !p.artifactsEnabled}))} 
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.artifactsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.artifactsEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-bold text-[var(--text-primary)]">AI-powered artifacts</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Build apps and interactive documents that use DROIDE inside the artifact.</p>
                  </div>
                  <button 
                    onClick={() => setSettings(p => ({...p, aiArtifactsEnabled: !p.aiArtifactsEnabled}))} 
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.aiArtifactsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.aiArtifactsEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Inline visualizations</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Allow DROIDE to generate interactive visualizations, charts, and diagrams directly in the conversation.</p>
                  </div>
                  <button 
                    onClick={() => setSettings(p => ({...p, inlineVisualizations: !p.inlineVisualizations}))} 
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.inlineVisualizations ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.inlineVisualizations ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Code execution and file creation</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Code execution and file creation</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">DROIDE can execute code and create and edit docs, spreadsheets, presentations, PDFs, and data reports. Required for skills.</p>
                  </div>
                  <button 
                    onClick={() => setSettings(p => ({...p, codeExecution: !p.codeExecution}))} 
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.codeExecution ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.codeExecution ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
                
                <div className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-[var(--text-primary)]">Allow network egress</p>
                    <button 
                      onClick={() => setSettings(p => ({...p, networkEgress: !p.networkEgress}))} 
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.networkEgress ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.networkEgress ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Allow DROIDE to access common package managers to install packages and libraries for data analysis, visualizations, and file processing. Monitor chats closely as this comes with security risks.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {settingsTab === 'connectors' && (
          <div className="p-6 space-y-8 max-w-2xl mx-auto pb-24">
            <section>
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Connectors</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Allow DROIDE to reference other apps and services for more context.
                  </p>
                </div>
                <button className="px-4 py-2 border border-[var(--surface-border)] rounded-xl text-sm font-bold active:scale-95 transition-transform whitespace-nowrap">Browse connectors</button>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Discovery</p>
                  <p className="text-xs text-[var(--text-muted)] max-w-xs mt-1">Let DROIDE surface connectors from the directory that may be relevant to your conversation.</p>
                </div>
                <button 
                  onClick={() => {
                    setSettings(p => ({ ...p, discoveryEnabled: !p.discoveryEnabled }));
                    vibrate(50);
                  }} 
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.discoveryEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.discoveryEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">API Keys</h3>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">Gemini API Key</label>
                <input 
                  type="password" 
                  value={settings.geminiApiKey || ''} 
                  onChange={e => setSettings(p => ({...p, geminiApiKey: e.target.value}))}
                  placeholder="Enter your API Key..."
                  className="w-full p-3.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-2xl text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
                />
                <p className="text-[11px] text-[var(--text-muted)] ml-1 mt-1.5">If empty, uses the default system key or prompts on demand.</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Storage & System</h3>
              <div className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">Local storage cache</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Free up space by clearing the local app cache. This will NOT delete your chats.</p>
                  </div>
                  <button 
                    onClick={handleClearCache}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold active:scale-95 transition-all ${isConfirmingClearCache ? 'bg-red-500 text-white border-red-600 shadow-md animate-pulse' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                  >
                    {isConfirmingClearCache ? 'Tap Again to Confirm' : 'Clear Cache'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {settingsTab === 'ai-requirements' && (
          <div className="p-6 space-y-6 max-w-2xl mx-auto pb-24">
            <section>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                    AI Direct Requirements
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    When the AI model discovers a lack of native tools, features, or UI capabilities to fulfill
                    your requests, it will directly post those requirements and feature requests here.
                    Developers can review this board.
                  </p>
                </div>
              </div>
            </section>
            
            <div className="space-y-4">
              {(!settings.aiRequirements || settings.aiRequirements.length === 0) ? (
                <div className="p-8 mt-4 border border-dashed border-[var(--border-drawer)] bg-[var(--surface-hover)] rounded-3xl flex flex-col items-center justify-center text-center">
                  <Monitor className="w-10 h-10 mb-4 text-[var(--text-muted)] opacity-50" />
                  <p className="text-sm font-bold text-[var(--text-primary)]">No AI requirements posted yet.</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xs">AI will post here when it hits limitations and requests developers to add missing capabilities to the app.</p>
                </div>
              ) : (
                settings.aiRequirements.map(req => (
                  <div key={req.id} className="p-5 border border-[var(--border-drawer)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors rounded-2xl relative group">
                    <button 
                      onClick={() => handleRemoveRequirement(req.id)}
                      className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100 hover:bg-[var(--surface-border)] rounded-full transition-all text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 font-bold text-[10px] rounded-full uppercase tracking-wider">
                        Feature Request
                      </span>
                      <span className="text-[10px] font-medium text-[var(--text-muted)]">
                        {new Date(req.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-[var(--text-primary)] mb-2 pr-8">{req.title}</h4>
                    <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">
                      {req.details}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-4 inset-x-4">
         <button onClick={onClose} className="w-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
           Save Changes
         </button>
      </div>
    </div>
  );
};
