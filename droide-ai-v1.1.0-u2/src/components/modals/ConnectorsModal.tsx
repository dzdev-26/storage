import React, { useState, useMemo } from 'react';
import { X, Search, CheckCircle2, Shield, Download, Trash2, Library, Menu } from 'lucide-react';
import { allMCPServers, MCPServer } from '../../data/mcpServers';

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  installedServers: string[];
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
}

export function ConnectorsModal({ isOpen, onClose, installedServers, onInstall, onUninstall }: ConnectorsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allMCPServers.forEach(s => cats.add(s.category));
    return ['All', 'Installed', ...Array.from(cats).sort()];
  }, []);

  const filteredServers = useMemo(() => {
    return allMCPServers.filter(server => {
      const matchSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          server.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isInstalled = installedServers.includes(server.id);
      const matchCategory = activeCategory === 'All' 
                            ? true 
                            : (activeCategory === 'Installed' ? isInstalled : server.category === activeCategory);
                            
      return matchSearch && matchCategory;
    });
  }, [searchQuery, activeCategory, installedServers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--bg-main)] z-[200] flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="px-4 py-3 sm:p-6 border-b border-[var(--surface-border)] flex items-center justify-between shrink-0 bg-[var(--surface)] shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 hover:bg-[var(--surface-hover)] rounded-full transition-colors active:scale-95"
          >
            <Menu className="w-5 h-5 text-[var(--text-primary)]" />
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
            <Library className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-tight flex items-center gap-2">
              MCP Server Directory
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] hidden sm:block">Browse 1000+ verified integrations for DROIDE</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-[var(--surface-hover)] rounded-full transition-colors active:scale-95 bg-[var(--surface-variant)]/50">
          <X className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-20 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`absolute md:static inset-y-0 left-0 w-64 border-r border-[var(--surface-border)] bg-[var(--bg-drawer)] md:bg-[var(--surface-variant)]/20 shrink-0 z-30 transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-4 border-b border-[var(--surface-border)] shrink-0 bg-[var(--bg-drawer)] md:bg-transparent sticky top-0 z-10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search servers..." 
                className="w-full bg-[var(--surface)] border border-[var(--surface-border)] pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar pb-20 md:pb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setIsSidebarOpen(false); // Close on mobile after selection
                }}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeCategory === cat 
                  ? 'bg-[var(--accent)] text-white shadow-md' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main List */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-[var(--bg-main)] pb-2 pt-2 z-10 border-b border-[var(--surface-border)] sm:border-none sm:pt-0">
            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
              <span className="hidden sm:inline">Category:</span>
              <span className="text-[var(--accent)]">{activeCategory}</span>
              <span className="bg-[var(--surface-variant)] px-2 py-0.5 rounded-full text-xs text-[var(--text-secondary)] ml-2 border border-[var(--surface-border)]">
                {filteredServers.length} servers
              </span>
            </h3>
          </div>
          
          {filteredServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center mt-10 sm:mt-20">
              <div className="w-20 h-20 rounded-full bg-[var(--surface-variant)] flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-[var(--text-muted)] opacity-50" />
              </div>
              <p className="text-[var(--text-primary)] font-bold text-xl mb-2">No MCP servers found</p>
              <p className="text-[var(--text-muted)] text-sm max-w-sm">Try adjusting your search query or select a different category to find what you're looking for.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pb-20">
              {filteredServers.map((server) => {
                const isInstalled = installedServers.includes(server.id);
                return (
                  <div key={server.id} className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl p-5 flex flex-col transition-all hover:shadow-xl hover:border-[var(--accent)]/40 group relative overflow-hidden">
                    {/* Optional gradient background element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--accent)]/5 to-transparent rounded-bl-full pointer-events-none opacity-50"></div>
                    
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div className="flex items-center gap-2 max-w-[85%]">
                        <h4 className="font-bold text-[var(--text-primary)] truncate text-base">{server.name}</h4>
                        {server.verified && (
                          <Shield className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0" title="Verified Publisher" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-5 flex-1 relative z-10">
                      {server.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--surface-border)]/50 relative z-10">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] truncate max-w-[55%]">
                        <span className="truncate" title={server.author}>{server.author}</span>
                      </div>
                      
                      {isInstalled ? (
                        <button 
                          onClick={() => onUninstall(server.id)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      ) : (
                        <button 
                          onClick={() => onInstall(server.id)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Install
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
