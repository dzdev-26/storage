export type Language = 
  | 'javascript' 
  | 'typescript' 
  | 'html' 
  | 'css' 
  | 'json' 
  | 'markdown' 
  | 'php' 
  | 'python' 
  | 'cpp' 
  | 'java' 
  | 'rust' 
  | 'sql' 
  | 'xml' 
  | 'yaml' 
  | 'sass' 
  | 'less' 
  | 'go' 
  | 'ruby'
  | 'perl'
  | 'swift'
  | 'kotlin'
  | 'scala'
  | 'shell'
  | 'dart'
  | 'elixir'
  | 'elm'
  | 'erlang'
  | 'graphql'
  | 'groovy'
  | 'haskell'
  | 'haxe'
  | 'lua'
  | 'objective-c'
  | 'pug'
  | 'clojure'
  | 'tcl'
  | 'toml'
  | 'vue'
  | 'angular'
  | 'liquid'
  | 'text';

export interface FileNode {
  id: string;
  name: string;
  content?: string; // Optional for folders
  language: Language;
  type: 'file' | 'folder';
  parentId?: string | null;
  isOpen?: boolean; // For folders
}

export interface AppSettings {
  theme: string;
  fontSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  tabSize: number;
  autoSave: boolean;
  fontFamily: string;
  matchBrackets: boolean;
  autocomplete: boolean;
  codeFolding: boolean;
  highlightActiveLine: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'oneDark',
  fontSize: 14,
  wordWrap: true,
  lineNumbers: true,
  tabSize: 2,
  autoSave: true,
  fontFamily: "'JetBrains Mono', monospace",
  matchBrackets: true,
  autocomplete: true,
  codeFolding: true,
  highlightActiveLine: true,
};

export const INITIAL_FILES: FileNode[] = [
  {
    id: '1',
    name: 'index.html',
    language: 'html',
    type: 'file',
    parentId: null,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App Preview</title>
  <style>
    body { font-family: system-ui; text-align: center; margin-top: 50px; }
    h1 { color: #333; }
    button { padding: 10px 20px; font-size: 16px; border-radius: 8px; border: none; background: #007bff; color: white; cursor: pointer; }
  </style>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello from Editor!</h1>
  <button id="btn">Click Me</button>
  <script src="script.js"></script>
</body>
</html>`
  },
  {
    id: '2',
    name: 'style.css',
    language: 'css',
    type: 'file',
    parentId: null,
    content: `/* Add your CSS here */
body {
  background-color: #f0f0f0;
}`
  },
  {
    id: '3',
    name: 'script.js',
    language: 'javascript',
    type: 'file',
    parentId: null,
    content: `// Add your JavaScript here
document.getElementById('btn').addEventListener('click', () => {
  console.log('Button clicked!');
});`
  }
];
