import { useEffect, useState } from 'react';
import { siteApi } from '@/api/site.api';
import toast from 'react-hot-toast';
import { Settings, Save, LayoutTemplate, Type, Image as ImageIcon } from 'lucide-react';

export default function AdminConfigPage() {
  const [config, setConfig] = useState<any>({ title: '', logo: '', subtitle: '', content: {} });
  const [contentText, setContentText] = useState('{}');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteApi.config().then((value) => {
      setConfig(value);
      setContentText(JSON.stringify(value.content ?? {}, null, 2));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    let parsedContent = {};
    try {
      parsedContent = JSON.parse(contentText);
    } catch {
      toast.error('Public page content must be valid JSON');
      return;
    }
    
    setSaving(true);
    try {
      const nextConfig = { ...config, content: parsedContent };
      await siteApi.saveConfig(nextConfig);
      setConfig(nextConfig);
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
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Site Configuration</h1>
          <p className="text-sm text-white/35 mt-0.5">Manage public website details and landing page content</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="admin-btn-primary">
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
            <h2 className="font-display font-bold text-lg text-white/80">Basic Settings</h2>
          </div>
          
          <div>
            <label className="admin-label"><Type size={12} className="inline mr-1 mb-0.5 opacity-50" /> Site Title</label>
            <input className="admin-input w-full" value={config.title ?? ''} onChange={(e) => setConfig({ ...config, title: e.target.value })} placeholder="Abmiti" />
          </div>
          
          <div>
            <label className="admin-label"><Type size={12} className="inline mr-1 mb-0.5 opacity-50" /> Site Subtitle</label>
            <input className="admin-input w-full" value={config.subtitle ?? ''} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} placeholder="Your personal financial companion" />
          </div>

          <div>
            <label className="admin-label"><ImageIcon size={12} className="inline mr-1 mb-0.5 opacity-50" /> Logo URL</label>
            <input className="admin-input w-full" value={config.logo ?? ''} onChange={(e) => setConfig({ ...config, logo: e.target.value })} placeholder="https://example.com/logo.png" />
            <p className="text-[10px] text-white/20 mt-1">Leave blank to use the default text logo.</p>
          </div>
        </div>

        {/* Advanced Content */}
        <div className="admin-card space-y-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2 pb-4 border-b border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <LayoutTemplate size={14} className="text-blue-400" />
            </div>
            <h2 className="font-display font-bold text-lg text-white/80">Landing Page Content</h2>
          </div>
          
          <div className="flex-1 flex flex-col">
            <label className="admin-label">Content (JSON)</label>
            <textarea 
              className="admin-input w-full flex-1 min-h-[250px] font-mono text-xs leading-relaxed" 
              value={contentText} 
              onChange={(e) => setContentText(e.target.value)} 
              placeholder="{}" 
              spellCheck={false}
            />
            <p className="text-[10px] text-white/20 mt-2">
              Valid JSON required. This data is passed to the public landing page components.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
