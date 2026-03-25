import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useReport } from '../context/ReportContext.jsx';

// Forge AI web components — self-registering Lit elements
import '@tylertech/forge-ai/ai-user-message';
import '@tylertech/forge-ai/ai-response-message';
import '@tylertech/forge-ai/ai-thinking-indicator';

const SIMULATED_RESPONSES = [
  (ctx) => `I can see your report "${ctx.title}" has ${ctx.widgetCount} widget${ctx.widgetCount !== 1 ? 's' : ''}. What would you like to change?`,
  () => `I'd suggest adding a KPI summary row at the top of the report to surface the most important metrics at a glance.`,
  (ctx) => `Based on the ${ctx.widgetTypes.join(', ')} widgets in your report, you might want to add a text widget with an executive summary.`,
  () => `To improve readability for print, consider adding section headers between major content blocks and using the divider widget to separate sections.`,
  () => `I can help you rearrange widgets for better visual hierarchy. Would you like me to suggest a layout?`,
];

export default function AIChatPanel() {
  const { handoffContext, widgets } = useReport();
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const responseIndexRef = useRef(0);

  const reportContext = useMemo(() => ({
    title: handoffContext?.reportTitle || 'Untitled Report',
    widgetCount: widgets.length,
    widgetTypes: [...new Set(widgets.map(w => w.type))],
    dataSource: handoffContext?.dataSource || '',
  }), [handoffContext, widgets]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = useCallback((text) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
    setIsThinking(true);

    // Simulate AI response
    setTimeout(() => {
      const idx = responseIndexRef.current % SIMULATED_RESPONSES.length;
      const response = SIMULATED_RESPONSES[idx](reportContext);
      responseIndexRef.current++;
      setIsThinking(false);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    }, 1500);
  }, [reportContext]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = inputRef.current?.value || '';
      if (text.trim()) {
        handleSend(text);
        inputRef.current.value = '';
      }
    }
  }, [handleSend]);

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-context-bar">
        <span className="ai-chat-context-label">Report context</span>
        <span className="ai-chat-context-value">{reportContext.title}</span>
        {reportContext.widgetCount > 0 && (
          <span className="ai-chat-context-badge">{reportContext.widgetCount} widgets</span>
        )}
      </div>

      <div className="ai-chat-messages">
        {messages.length === 0 && !isThinking && (
          <div className="ai-chat-welcome">
            <div className="ai-chat-welcome-icon">✦</div>
            <p className="ai-chat-welcome-title">Report Assistant</p>
            <p className="ai-chat-welcome-desc">
              Ask me to help refine your report layout, suggest improvements, or explain data relationships.
            </p>
            <div className="ai-chat-suggestions">
              {[
                'Suggest a better layout',
                'Add a summary section',
                'Improve print readability',
              ].map(s => (
                <button
                  key={s}
                  className="ai-chat-suggestion-chip"
                  onClick={() => handleSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          msg.role === 'user' ? (
            <forge-ai-user-message key={i}>
              <span>{msg.text}</span>
            </forge-ai-user-message>
          ) : (
            <forge-ai-response-message key={i}>
              <span>{msg.text}</span>
            </forge-ai-response-message>
          )
        ))}

        {isThinking && (
          <forge-ai-thinking-indicator></forge-ai-thinking-indicator>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-area">
        <textarea
          ref={inputRef}
          className="ai-chat-input"
          placeholder="Ask about this report..."
          rows={1}
          onKeyDown={handleKeyDown}
        />
        <button
          className="ai-chat-send-btn"
          onClick={() => {
            const text = inputRef.current?.value || '';
            if (text.trim()) {
              handleSend(text);
              inputRef.current.value = '';
            }
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
