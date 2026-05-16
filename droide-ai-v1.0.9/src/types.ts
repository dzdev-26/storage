export type ApiProvider = { 
  id: string; 
  name: string; 
  url: string; 
  apiKey: string; 
};

export type CustomModel = { 
  id: string; 
  modelId: string; 
  displayName: string; 
  providerId: string; 
  censoredMode: boolean; 
  caps?: { 
    vision: boolean; 
    audio: boolean; 
    video: boolean; 
    context: string; 
    speed: string; 
  }; 
};

export type AppSettings = { 
  theme: 'light' | 'dark' | 'system'; 
  systemPrompt: string; 
  geminiApiKey: string;
  selectedModelId: string;
  forceBengali: boolean;
  streamResponses: boolean;
  autoTts: boolean;
  adaptiveThinking: boolean;
  temperature: number;
  topP: number;
  customInstructions: string;
  userMemories: string[];
  formattingPreferences: {
    proseStyle: 'concise' | 'detailed' | 'narrative';
    listStyle: 'bullets' | 'numbered' | 'none';
    responseLength: 'short' | 'medium' | 'long';
  };
  writingStyle: string;
  notifications: {
    taskCompletion: boolean;
    scheduledJobs: boolean;
    soundEnabled: boolean;
    dispatchMessages: boolean;
  };
  installedSkills: Array<{ id: string, name: string, description: string, installedAt: number, standard: string }>;
  fullName: string;
  avatarUrl?: string;
  nickname: string;
  workDescription: string;
  chatFont: string;
  caretStyle?: 'bar' | 'underscore' | 'block' | 'dot' | 'slash';
  voice: string;
  locationMetadata: boolean;
  improveDroide?: boolean;
  discoveryEnabled: boolean;
  generateMemory: boolean;
  toolAccessMode: 'needed' | 'always' | 'never';
  artifactsEnabled: boolean;
  aiArtifactsEnabled: boolean;
  inlineVisualizations: boolean;
  codeExecution: boolean;
  networkEgress: boolean;
  aiRequirements?: { id: string; title: string; details: string; timestamp: number }[];
};

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
  folderId?: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelName?: string;
  images?: { data: string; mimeType: string }[];
  toolCalls?: any[];
  toolResults?: any[];
  thought?: string;
  isThoughtCollapsed?: boolean;
  activeTool?: string;
  isStreaming?: boolean;
  startTime?: number;
  endTime?: number;
  edits?: { content: string; timestamp: number }[];
}

export type Prompt = {
  id: string;
  name: string;
  content: string;
  createdAt?: number;
};
