const fs = require('fs');
const path = require('path');

const categoriesDir = path.join(__dirname, 'volyagent-agents', 'categories');
const categories = fs.readdirSync(categoriesDir).filter(f => fs.statSync(path.join(categoriesDir, f)).isDirectory());

const agents = [];

let idCounter = 1;

categories.forEach(category => {
  const catPath = path.join(categoriesDir, category);
  const files = fs.readdirSync(catPath).filter(f => f.endsWith('.md'));
  
  files.forEach(file => {
    if (file === 'README.md') return;
    
    const content = fs.readFileSync(path.join(catPath, file), 'utf8');
    
    const nameMatch = content.match(/name:\s*(.+)/);
    const descMatch = content.match(/description:\s*(?:["'](.+?)["']|(.+))/s);
    
    const parts = content.split('---');
    let prompt = '';
    if (parts.length >= 3) {
      prompt = parts.slice(2).join('---').trim();
    }
    
    if (nameMatch) {
      agents.push({
        id: 'agent-' + idCounter++,
        category: category.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        name: nameMatch[1].trim(),
        description: descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '',
        prompt: prompt
      });
    }
  });
});

const fileContent = `export const SUB_AGENTS = ${JSON.stringify(agents, null, 2)};`;
fs.writeFileSync(path.join(__dirname, 'src', 'lib', 'subagents.ts'), fileContent);
console.log(`Parsed ${agents.length} agents`);
