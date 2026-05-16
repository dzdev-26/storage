import React, { useState } from 'react';
import { X, Brain, Trash2, Plus, Info, Bell, Zap, SlidersHorizontal } from 'lucide-react';

export function MemoryMenu({ settings, setSettings, onClose, vibrate, showToast }: any) {
  const [newMemory, setNewMemory] = useState('');
  const [activeTab, setActiveTab] = useState<'memory' | 'writing' | 'formatting' | 'notifications'>('memory');

  const addMemory = () => {
    if (!newMemory.trim()) return;
    setSettings((p: any) => ({ ...p, userMemories: [...(p.userMemories || []), newMemory.trim()] }));
    setNewMemory('');
    vibrate?.(50);
    showToast?.('Memory added');
  };

  const deleteMemory = (index: number) => {
    setSettings((p: any) => ({
      ...p,
      userMemories: (p.userMemories || []).filter((_: any, i: number) => i !== index)
    }));
    vibrate?.(30);
    showToast?.('Memory deleted');
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-main)] z-[150] flex flex-col pt-2 animate-in fade-in duration-200">
      <div className="flex items-center justify-between p-5 pb-4">
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
            <span className="text-[11px] text-[var(--text-primary)]">Memory & Persona</span>
          </nav>
        </div>
        <div className="opacity-10 dark:opacity-20 text-[var(--text-primary)] mt-2">
          <Brain className="w-10 h-10" />
        </div>
      </div>

      <div className="flex px-4 py-2 space-x-2 border-b border-[var(--border-drawer)] overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('memory')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors ${activeTab === 'memory' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-muted)]'}`}>
          <Brain className="w-4 h-4 inline-block mr-1.5" /> Memories Let AI Learn
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 text-[var(--text-primary)]">
        
        {activeTab === 'memory' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-[var(--accent)]/10 rounded-xl border border-[var(--accent)]/20 text-[var(--accent)]">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Auto-Generated Memories</p>
                <p>AI builds a memory of your preferences, identity, and working style over time. You can manually view, edit, or delete what the AI remembers here.</p>
              </div>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border-drawer)]">
              <h3 className="font-medium mb-3">Learned Facts</h3>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Teach the AI a new fact..."
                  className="flex-1 bg-[--bg-main] border border-[--border-drawer] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMemory()}
                />
                <button onClick={addMemory} className="p-2 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {settings.userMemories?.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-6">No memories recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {settings.userMemories?.map((mem: string, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-drawer)] group">
                      <p className="text-sm pr-4">{mem}</p>
                      <button onClick={() => deleteMemory(idx)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}



      </div>
    </div>
  );
}
