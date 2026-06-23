import { IBudget } from '@/types';

export default function BudgetTemplateSelector({
  templates,
  onApply,
}: {
  templates: IBudget[];
  onApply: (templateId: string) => void;
}) {
  if (!templates.length) return null;

  return (
    <div className="card p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1">
        <p className="font-display font-bold">Templates</p>
        <p className="text-xs text-ink/45">Reuse a saved plan for this month.</p>
      </div>
      <select className="input md:max-w-xs" defaultValue="" onChange={(event) => event.target.value && onApply(event.target.value)}>
        <option value="" disabled>Apply template</option>
        {templates.map((template) => (
          <option key={template._id} value={template._id}>{template.templateName ?? `${template.month}/${template.year}`}</option>
        ))}
      </select>
    </div>
  );
}
