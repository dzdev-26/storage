import * as fs from 'fs';
import * as path from 'path';

const categories = ["Developer Tools", "Databases", "Cloud Providers", "Productivity", "Communication", "Marketing", "Finance", "Analytics", "Security", "AI & ML", "IoT", "HR & Payroll", "E-commerce", "CRM", "Design", "DevOps", "Customer Support", "Legal"];
const bases = ["GitHub", "GitLab", "Linear", "Jira", "Notion", "Slack", "Discord", "Google Drive", "AWS", "GCP", "Postgres", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Stripe", "Twilio", "SendGrid", "Shopify", "WordPress", "Firebase", "Supabase", "Vercel", "Cloudflare", "Docker", "Kubernetes", "DataDog", "New Relic", "Sentry", "PagerDuty"];

const servers = [];
let id_cnt = 1;

bases.forEach(b => {
  servers.push({
    id: `mcp-${id_cnt++}`,
    name: `${b} MCP Server`,
    description: `Official MCP server for ${b} integration.`,
    category: categories[Math.floor(Math.random() * categories.length)],
    verified: true,
    author: `${b} Inc`
  });
});

const tech_names = ["Postmark", "Mailgun", "Brevo", "HubSpot", "Salesforce", "Zendesk", "Intercom", "Freshdesk", "Asana", "Trello", "Monday.com", "ClickUp", "Smartsheet", "Wrike", "Basecamp", "Airtable", "Coda", "Quip", "Evernote", "Dropbox", "Box", "OneDrive", "SharePoint", "Figma", "Sketch", "Adobe XD", "InVision", "Marvel", "Zeplin", "Abstract", "Miro", "Mural", "Lucidchart", "Draw.io", "Whimsical", "Balsamiq", "Axure", "Framer", "Webflow", "Wix", "Squarespace", "Weebly", "Ghost", "Contentful", "Sanity", "Strapi", "Prismic", "Storyblok", "DatoCMS", "GraphCMS", "Keystone", "Payload", "Directus", "Netlify CMS", "Decap CMS", "Tina", "Forest Admin", "Retool", "Appsmith", "ToolJet", "Budibase", "Internal", "Glide", "Softr", "Bubble", "Adalo", "Thunkable", "Bravostudio", "Draftbit", "FlutterFlow", "SAP", "Oracle", "Microsoft Dynamics", "NetSuite", "Workday", "ServiceNow", "Splunk", "Sumo Logic", "Loggly", "Papertrail", "Logz.io", "Coralogix", "Meilisearch", "Algolia", "Typesense", "Solr", "Sphinx", "Vespa", "Milvus", "Pinecone", "Qdrant", "Weaviate", "Chroma", "Fauna", "CockroachDB", "TiDB", "Cassandra", "ScyllaDB", "Neo4j", "ArangoDB", "OrientDB", "TigerGraph", "InfluxDB", "TimescaleDB", "QuestDB", "ClickHouse", "Snowflake", "BigQuery", "Redshift", "Athena", "Presto", "Trino", "Spark", "Flink", "Kafka", "Pulsar", "RabbitMQ", "ActiveMQ", "NATS", "ZeroMQ", "Memcached", "Hazelcast", "Ehcache", "Ignite", "Couchbase", "CouchDB", "RethinkDB", "RavenDB", "Appwrite", "Auth0", "Okta", "Ping Identity", "OneLogin", "Clerk", "Stytch", "Supertokens", "Kratos"];

tech_names.forEach(t => {
  servers.push({
    id: `mcp-${id_cnt++}`,
    name: `${t} MCP Server`,
    description: `Community MCP server for seamless ${t} integration.`,
    category: categories[Math.floor(Math.random() * categories.length)],
    verified: true,
    author: `${t} Community`
  });
});

const verbs = ["Reader", "Writer", "Manager", "Analyzer", "Optimizer", "Generator", "Tracker", "Monitor", "Notifier", "Sync", "Export", "Import", "Search", "Filter", "Sorter", "Validator", "Formatter", "Linter", "Builder", "Deployer", "Tester", "Runner", "Executor", "Viewer", "Editor", "Creator", "Deleter", "Updater", "Patcher", "Diff", "Merge", "Review", "Approve", "Reject", "Comment", "Reply", "React", "Tag", "Label", "Assign", "Unassign", "Resolve", "Close", "Open", "Reopen", "Lock", "Unlock", "Pin", "Unpin", "Star", "Unstar", "Watch", "Unwatch", "Subscribe", "Unsubscribe", "Mute", "Unmute", "Block", "Unblock"];
const nouns = ["Files", "Folders", "Documents", "Images", "Videos", "Audio", "Code", "Scripts", "Styles", "Templates", "Configs", "Logs", "Metrics", "Traces", "Events", "Alerts", "Errors", "Exceptions", "Issues", "Bugs", "Features", "Tasks", "Stories", "Epics", "Sprints", "Releases", "Milestones", "Versions", "Branches", "Commits", "Pull Requests", "Merge Requests", "Reviews", "Comments", "Discussions", "Messages", "Chats", "Emails", "Notifications", "Users", "Roles", "Permissions", "Groups", "Teams", "Organizations", "Accounts", "Billing", "Invoices", "Payments", "Subscriptions", "Plans", "Products", "Services", "Orders", "Shipments", "Deliveries", "Returns", "Refunds", "Coupons", "Discounts", "Promotions", "Campaigns", "Ads", "Keywords", "Clicks", "Impressions", "Conversions", "Leads", "Contacts", "Accounts", "Opportunities", "Deals", "Quotes", "Contracts", "Signatures", "Approvals", "Workflows", "Pipelines", "Runs", "Jobs", "Builds", "Deployments", "Envs", "Secrets", "Vars", "Configs", "Certs", "Keys", "Tokens", "Pass", "Credentials"];

for (let i = 0; i < 850; i++) {
  const v = verbs[Math.floor(Math.random() * verbs.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  servers.push({
    id: `mcp-${id_cnt++}`,
    name: `${v} ${n} Service`,
    description: `MCP server allowing AI models to interact with ${n.toLowerCase()} efficiently.`,
    category: categories[Math.floor(Math.random() * categories.length)],
    verified: Math.random() > 0.4,
    author: ["OpenMCP", "AI Tools", "Agent Labs", "SystemX", "DevTools", "CloudCorp"][Math.floor(Math.random() * 6)]
  });
}

const dirPath = path.join(process.cwd(), 'src/data');
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}
const outPath = path.join(dirPath, 'mcp-servers.json');
fs.writeFileSync(outPath, JSON.stringify(servers, null, 2));
console.log(`Generated ${servers.length} servers to ${outPath}`);
