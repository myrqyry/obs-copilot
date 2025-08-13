import { promises as fs } from 'fs';
import path from 'path';
import globCb from 'glob';
import { promisify } from 'util';

// Backend API handler to perform glob-based knowledge base search server-side
const globAsync = promisify(globCb);

export interface KnowledgeSnippet {
  source: string;
  title: string;
  content: string;
  relevance: number;
}

// Utility: read markdown file and parse YAML frontmatter similar to EMP service
async function readMarkdownFile(filePath: string): Promise<{ text: string; title?: string; tags?: string[] } | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (match) {
      const frontmatter = match[1];
      const content = match[2];
      const titleMatch = frontmatter.match(/title:\s*["']?(.*?)["']?$/m);
      const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
      return {
        text: content,
        title: titleMatch ? titleMatch[1] : undefined,
        tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')) : undefined,
      };
    }
    return { text: fileContent };
  } catch (error) {
    console.error(`Error reading markdown file: ${filePath}`, error);
    return null;
  }
}

// Simple relevance calculation similar to client-side heuristic
function calculateRelevance(content: { text: string; tags?: string[] }, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) return 0;
  const text = content.text.toLowerCase();
  let score = 0;
  for (const term of queryTerms) {
    const matches = text.match(new RegExp(term, 'g')) || [];
    score += matches.length;
  }
  if (content.tags) {
    for (const term of queryTerms) {
      if (content.tags.includes(term)) score += 5;
    }
  }
  return Math.min(score / queryTerms.length, 10) / 10;
}

// Extract snippet based on query terms
function extractSnippet(content: string, query: string): string {
  const paragraphs = content.split('\n\n');
  let bestParagraph = '';
  let bestScore = 0;
  const queryTerms = query.toLowerCase().split(/\s+/);
  for (const paragraph of paragraphs) {
    const lower = paragraph.toLowerCase();
    let s = 0;
    for (const t of queryTerms) {
      if (lower.includes(t)) s += 1;
    }
    if (s > bestScore) {
      bestScore = s;
      bestParagraph = paragraph;
    }
  }
  return bestParagraph.split(/\s+/).slice(0, 200).join(' ');
}

// Main handler entry
export async function handleSearchKnowledgeBase(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get('query') ?? '').trim();
    const limit = parseInt(url.searchParams.get('limit') ?? '3', 10);

    const memoryBankPath = path.join(process.cwd(), 'memory_bank');
    const files = await globAsync('**/*.md', { cwd: memoryBankPath });
    const results: KnowledgeSnippet[] = [];

    for (const file of files) {
      const filePath = path.join(memoryBankPath, file);
      const content = await readMarkdownFile(filePath);
      if (!content) continue;
      const relevance = calculateRelevance(content, query);
      if (relevance > 0) {
        results.push({
          source: file,
          title: content.title || path.basename(file, '.md'),
          content: extractSnippet(content.text, query),
          relevance
        });
      }
    }

    const sorted = results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
    return new Response(JSON.stringify(sorted), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error in searchKnowledgeBase handler:', err);
    return new Response(JSON.stringify([]), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export default async function middleware(req: Request) {
  if (req.method === 'GET' && req.url?.startsWith('/api/search-knowledge-base')) {
    return await handleSearchKnowledgeBase(req);
  }
  // fallback: 404
  return new Response('Not Found', { status: 404 });
}