import * as fs from 'fs';
import * as path from 'path';

const categories = ["Developer Tools", "Databases", "Cloud", "Productivity", "Finance", "AI Tools"];
const bases = [
  "GitHub", "GitLab", "Linear", "Jira", "Slack", "Discord", "Google Drive",
  "Postgres", "MySQL", "MongoDB", "Redis", "Stripe", "Twilio", "Shopify", 
  "AWS", "GCP", "Vercel", "Cloudflare", "Docker", "Kubernetes"
];

const servers = [];
let id_cnt = 1;

bases.forEach(b => {
  servers.push({
    id: `mcp-${id_cnt++}`,
    name: `${b} MCP`,
    description: `Official MCP server for ${b} integration.`,
    category: categories[Math.floor(Math.random() * categories.length)],
    verified: true,
    author: `${b} Inc`
  });
});

const nouns = ["Files", "Docs", "Images", "Code", "Configs", "Issues", "Stats", "Users", "Deals", "Nodes"];
const verbs = ["Read", "Write", "Sync", "Export", "Analyze", "Monitor", "Generate"];

for (let i = 0; i < 1000; i++) {
  const v = verbs[Math.floor(Math.random() * verbs.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  servers.push({
    id: `mcp-${id_cnt++}`,
    name: `${v} ${n} Connector ${i}`,
    description: `High-performance MCP connector for ${v.toLowerCase()}ing ${n.toLowerCase()}.`,
    category: categories[Math.floor(Math.random() * categories.length)],
    verified: Math.random() > 0.3,
    author: "Community"
  });
}

fs.mkdirSync(path.join(process.cwd(), 'src/data'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'src/data/mcp-servers.json'), JSON.stringify(servers, null, 2));
console.log(`Generated ${servers.length} servers`);
