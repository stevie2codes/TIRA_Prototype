import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { sql } from '@codemirror/lang-sql';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { useReport } from '../../context/ReportContext.jsx';
import { getSchemaFor } from '../../data/sourceSchemas.js';
import './SqlEditor.css';

/**
 * Build a CodeMirror SQLConfig from the current semantic model so that
 * autocomplete suggests table and field names.
 */
function buildSchemaForAutocomplete(selectedSources) {
  const schema = {};
  for (const sel of selectedSources) {
    const baseSchema = sel.inlineSchema || getSchemaFor(sel.sourceId);
    schema[sel.sourceId] = baseSchema.map(f => f.name);
  }
  return schema;
}

export default function SqlEditor() {
  const { sqlDraft, setSqlDraft, selectedSources } = useReport();
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const schemaRef = useRef(buildSchemaForAutocomplete(selectedSources));

  // Update schema for autocomplete when sources change (without recreating the editor)
  useEffect(() => {
    schemaRef.current = buildSchemaForAutocomplete(selectedSources);
  }, [selectedSources]);

  useEffect(() => {
    if (!hostRef.current) return;

    const updateListener = EditorView.updateListener.of((vu) => {
      if (vu.docChanged) {
        setSqlDraft(vu.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: sqlDraft || '',
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        bracketMatching(),
        indentOnInput(),
        highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        sql({ schema: schemaRef.current, upperCaseKeywords: true }),
        autocompletion(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
        updateListener,
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { fontFamily: '"Menlo", "Monaco", "Courier New", monospace' },
          '.cm-content': { padding: '12px 0' },
          '.cm-gutters': { background: '#fafbfc', borderRight: '1px solid #e3e8ee', color: '#9ca3af' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // We intentionally only re-create the editor when the host element changes.
    // Doc updates flow through React state via setSqlDraft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External regeneration (e.g. user clicks "Regenerate from model") syncs doc
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (sqlDraft !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: sqlDraft || '' },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sqlDraft]);

  return (
    <div className="sql-editor">
      <div className="sql-editor__host" ref={hostRef} />
    </div>
  );
}
