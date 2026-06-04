import type { RepoSnapshot, RepoProfile, ExtractedNode, RichEdge, NodeType } from '@/lib/types/repo-diagram';

const MAX_HEURISTIC_NODES = 18;

function slugId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'component';
}

function humanLabel(path: string): string {
  const base = path.split('/').pop()?.replace(/\.(py|ts|tsx|js|go|rs)$/, '') ?? path;
  return base
    .split(/[_-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function detectDbFromFiles(files: { path: string; content: string }[]): { id: string; label: string; path: string } | null {
  for (const file of files) {
    const c = file.content.toLowerCase();
    if (c.includes('sqlite3') || c.includes('sqlite')) {
      return { id: 'sqlite_database', label: 'SQLite Database', path: file.path };
    }
    if (c.includes('postgres') || c.includes('psycopg')) {
      return { id: 'postgres_database', label: 'PostgreSQL Database', path: file.path };
    }
    if (c.includes('mongodb') || c.includes('mongoose')) {
      return { id: 'mongo_database', label: 'MongoDB', path: file.path };
    }
    if (c.includes('redis')) {
      return { id: 'redis_cache', label: 'Redis Cache', path: file.path };
    }
  }
  const dbPaths = files.map((f) => f.path).filter((p) => /database|db\.py|models\//i.test(p));
  if (dbPaths[0]) {
    return { id: slugId(dbPaths[0]), label: humanLabel(dbPaths[0]), path: dbPaths[0] };
  }
  return null;
}

function inferNodeType(path: string): NodeType {
  const p = path.toLowerCase();
  if (p.includes('middleware')) return 'MIDDLEWARE';
  if (p.includes('auth')) return 'AUTH';
  if (/route|router|api|controller|endpoint|handler/.test(p)) return 'API_ROUTE';
  if (/model|schema|database|db|repository|dao/.test(p)) return 'DATABASE';
  if (/page\.(tsx|jsx|vue)|^pages\//.test(p)) return 'PAGE';
  if (/service|worker|task/.test(p)) return 'SERVICE';
  return 'SERVICE';
}

/**
 * Deterministic component extraction from file tree + ingested sources when LLM output is invalid.
 */
export function extractComponentsHeuristic(
  snapshot: RepoSnapshot,
  repoProfile?: RepoProfile
): ExtractedNode[] {
  const nodes: ExtractedNode[] = [];
  const seen = new Set<string>();
  const paths = snapshot.fileTree;
  const files = snapshot.selectedFiles;

  const addNode = (partial: Omit<ExtractedNode, 'confidence' | 'description'> & { description?: string }) => {
    if (seen.has(partial.id) || nodes.length >= MAX_HEURISTIC_NODES) return;
    seen.add(partial.id);
    nodes.push({
      description: partial.description ?? `Detected from repository structure (${partial.sourceFiles.join(', ')})`,
      confidence: 'medium',
      ...partial,
    });
  };

  const entryCandidates = ['main.py', 'app.py', 'manage.py', 'index.ts', 'server.ts', 'src/index.ts'];
  for (const entry of entryCandidates) {
    if (paths.includes(entry)) {
      addNode({
        id: slugId(entry),
        label: humanLabel(entry),
        type: 'SERVICE',
        sourceFiles: [entry],
        description: 'Application entry point.',
      });
      break;
    }
  }

  const routePatterns = [
    /^app\/routers?\/.+\.py$/i,
    /^app\/api\/.+\.py$/i,
    /^routers?\/.+\.py$/i,
    /^routes?\/.+\.py$/i,
    /^app\/routes?\/.+\.py$/i,
    /^src\/routes?\/.+\.(ts|js)$/i,
    /^app\/api\/.+\/route\.ts$/i,
  ];

  for (const path of paths) {
    if (!routePatterns.some((re) => re.test(path))) continue;
    if (path.endsWith('__init__.py')) continue;
    addNode({
      id: slugId(path),
      label: humanLabel(path),
      type: inferNodeType(path),
      sourceFiles: [path],
    });
  }

  for (const path of paths) {
    if (nodes.length >= MAX_HEURISTIC_NODES) break;
    if (!/middleware\.(py|ts|js)$/.test(path)) continue;
    addNode({
      id: slugId(path),
      label: 'Middleware',
      type: 'MIDDLEWARE',
      sourceFiles: [path],
    });
  }

  const db = detectDbFromFiles(files);
  if (db) {
    addNode({
      id: db.id,
      label: db.label,
      type: 'DATABASE',
      sourceFiles: [db.path],
      description: 'Data persistence layer inferred from imports and config.',
    });
  }

  if (repoProfile?.primaryStack.framework?.toLowerCase().includes('fastapi') && nodes.length < 3) {
    addNode({
      id: 'fastapi_app',
      label: 'FastAPI Application',
      type: 'SERVICE',
      sourceFiles: files.map((f) => f.path).slice(0, 3),
      description: 'HTTP API application (FastAPI).',
    });
  }

  if (nodes.length === 0 && paths.length > 0) {
    const topPy = paths.filter((p) => p.endsWith('.py') && !p.includes('test')).slice(0, 5);
    for (const path of topPy) {
      addNode({
        id: slugId(path),
        label: humanLabel(path),
        type: inferNodeType(path),
        sourceFiles: [path],
      });
    }
  }

  return nodes;
}

export function inferRelationshipsHeuristic(nodes: ExtractedNode[]): {
  edges: RichEdge[];
  workflows: { name: string; description: string; steps: string[] }[];
} {
  if (nodes.length < 2) {
    return { edges: [], workflows: [] };
  }

  const edges: RichEdge[] = [];
  const entry =
    nodes.find((n) => n.type === 'SERVICE') ??
    nodes.find((n) => /main|app|entry|server/i.test(n.id)) ??
    nodes[0];
  const routes = nodes.filter((n) => n.type === 'API_ROUTE' || n.type === 'CONTROLLER');
  const databases = nodes.filter((n) => n.type === 'DATABASE' || n.type === 'CACHE');
  const auth = nodes.find((n) => n.type === 'AUTH');
  const middleware = nodes.find((n) => n.type === 'MIDDLEWARE');

  const pushEdge = (from: string, to: string, type: string, label: string, protocol: string) => {
    const key = `${from}->${to}`;
    if (edges.some((e) => `${e.from}->${e.to}` === key)) return;
    edges.push({
      from,
      to,
      type,
      label,
      direction: 'sync',
      protocol,
      dataFlow: '',
      triggeredBy: 'user_action',
      description: `Inferred connection between ${from} and ${to}.`,
      confidence: 'low',
    });
  };

  if (middleware && entry) pushEdge(entry.id, middleware.id, 'guards', 'passes through', 'http');
  if (auth && entry) pushEdge(entry.id, auth.id, 'auth_check', 'authenticates', 'http');

  for (const route of routes) {
    if (entry) pushEdge(entry.id, route.id, 'http_call', 'handles request', 'http');
    for (const db of databases) {
      pushEdge(route.id, db.id, 'db_query', 'reads/writes data', 'db');
    }
  }

  if (routes.length === 0 && entry && databases.length) {
    for (const db of databases) {
      pushEdge(entry.id, db.id, 'db_query', 'persists data', 'db');
    }
  }

  const workflows =
    routes.length > 0 && entry
      ? [
          {
            name: 'Request handling',
            description: 'Primary request path through the API entry and route handlers.',
            steps: [entry.id, ...(middleware ? [middleware.id] : []), ...routes.slice(0, 4).map((r) => r.id)],
          },
        ]
      : [];

  return { edges: edges.slice(0, 40), workflows };
}
