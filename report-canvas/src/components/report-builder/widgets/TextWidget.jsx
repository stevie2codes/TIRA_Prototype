// Forge components: none
export default function TextWidget({ widget }) {
  const text = widget.config?.text || 'Double-click to edit text content.';

  return (
    <div className="text-widget">
      <h3 className="widget-title">{widget.title}</h3>
      <p className="text-content">{text}</p>
    </div>
  );
}
