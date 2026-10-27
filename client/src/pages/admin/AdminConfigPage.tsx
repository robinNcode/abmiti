import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { siteApi } from '@/api/site.api';
import toast from 'react-hot-toast';
import { Settings, Save, LayoutTemplate, Type, Image as ImageIcon, Upload, Trash2, X } from 'lucide-react';
import { getImageUrl } from '@/utils';

interface ContentField {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

const CONTENT_FIELDS: ContentField[] = [
  { key: 'heroTitle', label: 'Hero Title', placeholder: 'Master Your Money with Confidence' },
  { key: 'heroSubtitle', label: 'Hero Subtitle', placeholder: 'Abmiti is your personal financial companion…', multiline: true },
  { key: 'blogTitle', label: 'Blog Section Title', placeholder: 'From the Abmiti blog' },
  { key: 'contactTitle', label: 'Contact Section Title', placeholder: "We'd love your feedback" },
];

interface SiteConfig {
  title: string;
  subtitle: string;
  logo: string;
  content: Record<string, string>;
}

const emptyConfig: SiteConfig = { title: '', subtitle: '', logo: '', content: {} };

const labelFromKey = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'Field';

const normalizeContent = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, v == null ? '' : String(v)]),
  );
};

const isValidImageRef = (value: string): boolean =>
  /^(https?:\/\/|data:image\/|\/|public\/)/i.test(value);

const validate = (config: SiteConfig): string | null => {
  if (config.title.length > 120) return 'Site title is too long (max 120 characters)';
  if (config.subtitle.length > 300) return 'Site subtitle is too long (max 300 characters)';
  if (config.logo.trim() && !isValidImageRef(config.logo.trim())) {
    return 'Logo must be a valid image URL (https://… or an uploaded path)';
  }
  for (const [key, value] of Object.entries(config.content)) {
    if (typeof value !== 'string') return `Content field "${key}" must be text`;
    if (value.length > 500) return `Content field "${labelFromKey(key)}" is too long (max 500 characters)`;
  }
  return null;
};

export default function AdminConfigPage() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SiteConfig>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    siteApi.config()
      .then((value: any) => {
        setConfig({
          title: typeof value?.title === 'string' ? value.title : '',
          subtitle: typeof value?.subtitle === 'string' ? value.subtitle : '',
          logo: typeof value?.logo === 'string' ? value.logo : '',
          content: normalizeContent(value?.content),
        });
      })
      .catch(() => { })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const fields = useMemo<ContentField[]>(() => {
    const known = new Map(CONTENT_FIELDS.map((f) => [f.key, f]));
    for (const key of Object.keys(config.content)) {
      if (!known.has(key)) known.set(key, { key, label: labelFromKey(key) });
    }
    return [...known.values()];
  }, [config.content]);

  const setContent = (key: string, value: string) =>
    setConfig((cur) => ({ ...cur, content: { ...cur.content, [key]: value } }));

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await siteApi.uploadPostImage(file);
      setConfig((cur) => ({ ...cur, logo: url }));
      toast.success('Logo uploaded');
    } catch {
      toast.error('Logo upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    const payload: SiteConfig = {
      title: config.title.trim(),
      subtitle: config.subtitle.trim(),
      logo: config.logo.trim(),
      content: Object.fromEntries(
        Object.entries(config.content).map(([k, v]) => [k, v.trim()]),
      ),
    };

    const error = validate(payload);
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const saved = await siteApi.saveConfig(payload);
      setConfig({
        title: typeof saved?.title === 'string' ? saved.title : payload.title,
        subtitle: typeof saved?.subtitle === 'string' ? saved.subtitle : payload.subtitle,
        logo: typeof saved?.logo === 'string' ? saved.logo : payload.logo,
        content: normalizeContent(saved?.content ?? payload.content),
      });
      toast.success('Website configuration saved');
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-terra-light border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">{t('Site Configuration')}</h1>
          <p className="text-sm text-white/35 mt-0.5">{t('Manage public website details and landing page content')}</p>
        </div>
        <button onClick={handleSave} disabled={saving || uploading} className="admin-btn-primary">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="admin-card space-y-5">
          <div className="flex items-center gap-2 mb-2 pb-4 border-b border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-terra/10 flex items-center justify-center">
              <Settings size={14} className="text-terra-light" />
            </div>
            <h2 className="font-display font-bold text-lg text-white/80">{t('Basic Settings')}</h2>
          </div>

          <div>
            <label className="admin-label"><Type size={12} className="inline mr-1 mb-0.5 opacity-50" /> Site Title</label>
            <input className="admin-input w-full" value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} placeholder="Abmiti" />
          </div>

          <div>
            <label className="admin-label"><Type size={12} className="inline mr-1 mb-0.5 opacity-50" /> Site Subtitle</label>
            <input className="admin-input w-full" value={config.subtitle} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} placeholder="Your personal financial companion" />
          </div>

          <div>
            <label className="admin-label"><ImageIcon size={12} className="inline mr-1 mb-0.5 opacity-50" /> Logo</label>
            <div className="flex items-center gap-3">
              {config.logo ? (
                <div className="relative shrink-0">
                  <img src={getImageUrl(config.logo)} alt="Logo preview" className="h-12 max-w-[160px] object-contain rounded-md border border-white/10 bg-white/5 p-1" />
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, logo: '' })}
                    title="Remove logo"
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-12 rounded-md border border-dashed border-white/15 flex items-center justify-center text-white/15 shrink-0">
                  <ImageIcon size={16} />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="admin-btn-ghost"
              >
                {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Upload size={13} /> {config.logo ? 'Replace' : 'Upload'}</>}
              </button>
              {config.logo && (
                <button type="button" onClick={() => setConfig({ ...config, logo: '' })} className="admin-icon-btn text-red-400/60 hover:text-red-400" title="Remove logo">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
            />
            <input
              className="admin-input w-full mt-2 text-xs"
              value={config.logo}
              onChange={(e) => setConfig({ ...config, logo: e.target.value })}
              placeholder="or paste an image URL"
            />
            <p className="text-[10px] text-white/20 mt-1">Leave blank to use the default text logo.</p>
          </div>
        </div>

        {/* Landing Page Content */}
        <div className="admin-card space-y-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2 pb-4 border-b border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <LayoutTemplate size={14} className="text-blue-400" />
            </div>
            <h2 className="font-display font-bold text-lg text-white/80">{t('Landing Page Content')}</h2>
          </div>

          <div className="flex-1 space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="admin-label">{field.label}</label>
                {field.multiline ? (
                  <textarea
                    className="admin-input w-full min-h-[80px] leading-relaxed resize-y"
                    value={config.content[field.key] ?? ''}
                    onChange={(e) => setContent(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    className="admin-input w-full"
                    value={config.content[field.key] ?? ''}
                    onChange={(e) => setContent(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
            <p className="text-[10px] text-white/20">
              These values feed the public landing page. Leave a field blank to use its built-in default text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}