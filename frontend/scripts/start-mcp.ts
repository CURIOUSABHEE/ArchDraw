#!/usr/bin/env node
import { createMCPServer } from '../mcp-server/src/server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'node:http';

const server = createMCPServer();
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
});

const httpServer = createServer((req, res) => {
  if (req.url === '/api/mcp') {
    transport.handleRequest(req, res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

httpServer.listen(3000, () => {
  console.log('Starting ArchDraw MCP server on http://localhost:3000/api/mcp');
});