import { readFile, readdir, stat } from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { logger } from '@/utils/logger';
import { catppuccinMochaColors } from '@/constants';

/**
 * Represents a snippet of knowledge base content with metadata
 */
export interface KnowledgeSnippet {
  source: string;
  title: string;
  content: string;
  relevance: number;
}

/**
 * Externalized Memory Protocol (EMP) Service
 * Handles knowledge base operations and semantic search
 */
class EmpService {
  private memoryBankPath: string;
  
  constructor(memoryBankPath: string = path.join(process.cwd(), 'memory_bank')) {
    this.memoryBankPath = memoryBankPath;
  }

  /**
   * Perform semantic search across the knowledge base
   * @param query Search query (natural language or keywords)
   * @param limit Maximum number of results to return
   * @returns Array of relevant knowledge snippets
   */
  async searchKnowledgeBase(query: string, limit: number = 3): Promise<KnowledgeSnippet[]> {
    try {
      const files = await glob('**/*.md', { cwd: this.memoryBankPath });
      const results: KnowledgeSnippet[] = [];

      for (const file of files) {
        const filePath = path.join(this.memoryBankPath, file);
        const content = await this.readMarkdownFile(filePath);
        
        if (!content) continue;
        
        const relevance = this.calculateRelevance(content, query);
        if (relevance > 0) {
          results.push({
            source: file,
            title: content.title || path.basename(file, '.md'),
            content: this.extractSnippet(content.text, query),
            relevance
          });
        }
      }

      // Sort by relevance and limit results
      return results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);
    } catch (error) {
      logger.error('EMP search error:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score between content and query
   * @param content Knowledge base content
   * @param query Search query
   * @returns Relevance score (0-1)
   */
  private calculateRelevance(content: {text: string, tags?: string[]}, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    if (queryTerms.length === 0) return 0;
    
    const contentText = content.text.toLowerCase();
    let score = 0;
    
    // Basic term frequency scoring
    for (const term of queryTerms) {
      const matches = contentText.match(new RegExp(term, 'g')) || [];
      score += matches.length;
    }
    
    // Boost if query term is in tags
    if (content.tags) {
      for (const term of queryTerms) {
        if (content.tags.includes(term)) {
          score += 5; // Significant boost for tag matches
        }
      }
    }
    
    // Normalize score (0-10 range)
    return Math.min(score / queryTerms.length, 10) / 10;
  }

  /**
   * Extract the most relevant snippet from content
   * @param content Full content text
   * @param query Search query
   * @returns Extracted snippet (max 200 words)
   */
  private extractSnippet(content: string, query: string): string {
    const paragraphs = content.split('\n\n');
    let bestParagraph = '';
    let bestScore = 0;
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    for (const paragraph of paragraphs) {
      const lowerParagraph = paragraph.toLowerCase();
      let score = 0;
      
      for (const term of queryTerms) {
        if (lowerParagraph.includes(term)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestParagraph = paragraph;
      }
    }
    
    // Return the best paragraph, truncated to 200 words
    return bestParagraph.split(/\s+/).slice(0, 200).join(' ');
  }

  /**
   * Read and parse markdown file with YAML frontmatter
   * @param filePath Path to markdown file
   * @returns Object with metadata and content
   */
  private async readMarkdownFile(filePath: string): Promise<{text: string, title?: string, tags?: string[]} | null> {
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      
      if (match) {
        const frontmatter = match[1];
        const content = match[2];
        const titleMatch = frontmatter.match(/title:\s*["']?(.*?)["']?$/m);
        const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
        
        return {
          text: content,
          title: titleMatch ? titleMatch[1] : undefined,
          tags: tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, '')) : undefined
        };
      }
      
      return { text: fileContent };
    } catch (error) {
      logger.error(`Error reading EMP file: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Format knowledge snippets as XML for context injection
   * @param snippets Knowledge snippets
   * @returns Formatted XML string
   */
  formatAsContext(snippets: KnowledgeSnippet[]): string {
    return snippets.map(snippet => {
      return `<knowledge_base_context>
<document source="${snippet.source}">
# ${snippet.title}
${snippet.content}
</document>
</knowledge_base_context>`;
    }).join('\n\n');
  }
}

export const empService = new EmpService();
