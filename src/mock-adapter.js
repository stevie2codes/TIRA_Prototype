/**
 * Mock AgentAdapter for the Forge AI Chatbot.
 * Simulates AI responses using the existing mock suggestion data,
 * streaming a summary + query card back into the chatbot.
 */
import { AgentAdapter } from '@tylertech/forge-ai/ai-chatbot';
import { suggestions } from './mock-data.js';

/**
 * Maps user message text to a suggestion index.
 */
function findSuggestion(text) {
  const lower = text.toLowerCase();
  if (lower.includes('budget')) return suggestions[2];
  if (lower.includes('expenditure') || lower.includes('fund')) return suggestions[2];
  if (lower.includes('revenue')) return suggestions[2];
  if (lower.includes('permit')) return suggestions[0];
  if (lower.includes('violation') || lower.includes('code')) return suggestions[1];
  if (lower.includes('arrest')) return suggestions[3];
  if (lower.includes('case') || lower.includes('disposition')) return suggestions[4];
  return suggestions[0]; // default
}

/**
 * Builds a markdown response from a suggestion, including the summary
 * and a formatted query card with data preview.
 */
function buildMarkdownResponse(suggestion) {
  const s = suggestion;
  const t = s.transparency;

  // Summary
  let md = s.aiSummary + '\n\n';

  // Query card as a structured markdown block
  md += `---\n\n`;
  md += `### ${s.reportTitle}\n`;
  md += `📊 **${s.dataSource}** · ${s.freshness}\n\n`;

  // Data preview table (first 4 rows, first 5 columns)
  if (s.columns && s.data && s.data.length > 0) {
    const previewCols = s.columns.slice(0, 5);
    const previewRows = s.data.slice(0, 4);

    md += '| ' + previewCols.map(c => c.header).join(' | ') + ' |\n';
    md += '| ' + previewCols.map(() => '---').join(' | ') + ' |\n';
    previewRows.forEach(row => {
      md += '| ' + previewCols.map(c => String(row[c.property] ?? '')).join(' | ') + ' |\n';
    });

    if (s.data.length > 4) {
      md += `\n*${s.data.length - 4} more rows available*\n`;
    }
    md += '\n';
  }

  // Transparency info
  if (t) {
    md += `**Data Source:** ${t.dataSourceDetail} (${t.system})\n`;
    md += `**Records:** ${t.totalRecords} · **Last Updated:** ${t.lastUpdated}\n\n`;

    if (t.assumptions && t.assumptions.length) {
      md += `**Assumptions:**\n`;
      t.assumptions.forEach(a => { md += `- ${a}\n`; });
      md += '\n';
    }
  }

  // SQL
  if (s.sqlCode) {
    md += '**Generated SQL:**\n';
    md += '```sql\n' + s.sqlCode + '\n```\n\n';
  }

  return md;
}

export class MockChatAdapter extends AgentAdapter {
  #threadId = 'mock-thread-1';
  #onExpand = null;

  constructor({ onExpand } = {}) {
    super();
    this.#onExpand = onExpand;
  }

  get threadId() {
    return this.#threadId;
  }

  set threadId(value) {
    this.#threadId = value;
  }

  async connect() {
    this._updateState({ isConnected: true, isConnecting: false });
  }

  async disconnect() {
    this._updateState({ isConnected: false });
  }

  sendMessage(messages) {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const suggestion = findSuggestion(lastMessage.content);
    const response = buildMarkdownResponse(suggestion);

    // Simulate streaming with a short delay
    this._updateState({ isRunning: true });
    this._emitRunStarted();

    const messageId = `msg-${Date.now()}`;

    // Start after a brief "thinking" pause
    setTimeout(() => {
      this._emitMessageStart(messageId);

      // Stream the response in chunks for a natural feel
      const chunkSize = 80;
      let offset = 0;
      const streamInterval = setInterval(() => {
        const chunk = response.slice(offset, offset + chunkSize);
        if (chunk) {
          this._emitMessageDelta(messageId, chunk);
          offset += chunkSize;
        } else {
          clearInterval(streamInterval);
          this._emitMessageEnd(messageId);
          this._emitRunFinished();
          this._updateState({ isRunning: false });
        }
      }, 30);
    }, 800);
  }

  sendToolResult() {}

  abort() {
    this._updateState({ isRunning: false });
    this._emitRunAborted();
  }
}
