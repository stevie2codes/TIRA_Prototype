// Forge components: none — thin wrapper around the Tiptap RichTextEditor
import { useRef, useCallback } from 'react';
import { useReport } from '../../../context/ReportContext.jsx';
import RichTextEditor from './RichTextEditor.jsx';

const BLOCK_TAG_RE = /<(h[1-6]|p|ul|ol|blockquote|div)\b/i;

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// Build the editor's initial HTML, migrating legacy block-styled widgets:
// section headers (legacy `bold` + large `fontSize`) become a real <h2>.
function initialContent(widget) {
  const cfg = widget.config || {};
  const raw = cfg.text ?? widget.title ?? '';
  if (BLOCK_TAG_RE.test(raw)) return raw;          // already rich HTML
  if (cfg.bold && (cfg.fontSize ?? 0) >= 18 && raw) {
    return `<h2>${escapeHtml(raw)}</h2>`;          // legacy section header → H2
  }
  return raw ? escapeHtml(raw) : '';               // plain text → paragraph
}

export default function TextWidget({ widget }) {
  const { updateWidget } = useReport();
  // Capture initial content once; Tiptap owns the doc thereafter.
  const initialRef = useRef(null);
  if (initialRef.current === null) initialRef.current = initialContent(widget);

  const handleChange = useCallback((html) => {
    // Persist HTML and drop stale legacy block-style fields after first edit.
    const { bold, fontSize, color, fontFamily, ...rest } = widget.config || {};
    updateWidget(widget.id, { config: { ...rest, text: html } });
  }, [widget, updateWidget]);

  return (
    <div className="text-widget">
      <RichTextEditor value={initialRef.current} onChange={handleChange} />
    </div>
  );
}
