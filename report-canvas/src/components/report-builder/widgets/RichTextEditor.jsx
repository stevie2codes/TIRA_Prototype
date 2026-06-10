// Forge components: none — Tiptap (v3) rich text editor with a Forge-styled bubble menu
import { useEffect, useRef } from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import './RichTextEditor.css';

const COLOR_SWATCHES = ['#111827', '#4b5563', '#2563eb', '#dc2626', '#059669', '#d97706'];
const SIZE_PRESETS = [
  { label: 'S', size: '12px', title: 'Small' },
  { label: 'M', size: null, title: 'Normal' },
  { label: 'L', size: '18px', title: 'Large' },
];

// Stable presentational button — onMouseDown/preventDefault keeps the editor
// selection intact so commands apply to the highlighted text.
function ToolBtn({ active, onClick, title, children, style }) {
  return (
    <button
      type="button"
      className={`rte-btn${active ? ' rte-btn--active' : ''}`}
      title={title}
      style={style}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange }) {
  // Keep latest onChange without recreating the editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debounceRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      TextStyle,
      Color,
      FontSize,
      Placeholder.configure({ placeholder: 'Click to type…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      clearTimeout(debounceRef.current);
      const html = editor.getHTML();
      debounceRef.current = setTimeout(() => onChangeRef.current?.(html), 300);
    },
    onBlur: ({ editor }) => {
      clearTimeout(debounceRef.current);
      onChangeRef.current?.(editor.getHTML());
    },
  });

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Reactive active-state flags so the bubble menu reflects the selection.
  const s = useEditorState({
    editor,
    selector: ({ editor }) => editor && {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      p: editor.isActive('paragraph'),
      h1: editor.isActive('heading', { level: 1 }),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      bullet: editor.isActive('bulletList'),
      ordered: editor.isActive('orderedList'),
      quote: editor.isActive('blockquote'),
    },
  });

  if (!editor) return null;

  const chain = () => editor.chain().focus();

  return (
    <div className="rte" onMouseDown={(e) => e.stopPropagation()}>
      <BubbleMenu editor={editor} className="rte-bubble">
        <ToolBtn active={s?.bold} title="Bold" onClick={() => chain().toggleBold().run()}><b>B</b></ToolBtn>
        <ToolBtn active={s?.italic} title="Italic" onClick={() => chain().toggleItalic().run()}><i>I</i></ToolBtn>
        <ToolBtn active={s?.underline} title="Underline" onClick={() => chain().toggleUnderline().run()}><u>U</u></ToolBtn>
        <ToolBtn active={s?.strike} title="Strikethrough" onClick={() => chain().toggleStrike().run()}><s>S</s></ToolBtn>

        <span className="rte-sep" />

        <ToolBtn active={s?.p} title="Normal text" onClick={() => chain().setParagraph().run()}>¶</ToolBtn>
        <ToolBtn active={s?.h1} title="Heading 1" onClick={() => chain().toggleHeading({ level: 1 }).run()}>H1</ToolBtn>
        <ToolBtn active={s?.h2} title="Heading 2" onClick={() => chain().toggleHeading({ level: 2 }).run()}>H2</ToolBtn>
        <ToolBtn active={s?.h3} title="Heading 3" onClick={() => chain().toggleHeading({ level: 3 }).run()}>H3</ToolBtn>

        <span className="rte-sep" />

        <ToolBtn active={s?.bullet} title="Bullet list" onClick={() => chain().toggleBulletList().run()}>•</ToolBtn>
        <ToolBtn active={s?.ordered} title="Numbered list" onClick={() => chain().toggleOrderedList().run()}>1.</ToolBtn>
        <ToolBtn active={s?.quote} title="Quote" onClick={() => chain().toggleBlockquote().run()}>❝</ToolBtn>

        <span className="rte-sep" />

        {SIZE_PRESETS.map(p => (
          <ToolBtn
            key={p.label}
            title={p.title}
            onClick={() => p.size ? chain().setFontSize(p.size).run() : chain().unsetFontSize().run()}
          >{p.label}</ToolBtn>
        ))}

        <span className="rte-sep" />

        <span className="rte-colors">
          {COLOR_SWATCHES.map(c => (
            <button
              key={c}
              type="button"
              className="rte-swatch"
              title={`Color ${c}`}
              style={{ background: c }}
              onMouseDown={(e) => { e.preventDefault(); chain().setColor(c).run(); }}
            />
          ))}
        </span>
      </BubbleMenu>

      <EditorContent editor={editor} className="rte-content" />
    </div>
  );
}
