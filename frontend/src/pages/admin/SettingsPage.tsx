import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { BusinessSettings } from '../../types';
import { CheckCircle2, Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        setSettings(res.data.settings);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.put('/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Failed to update business settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="h-64 bg-white rounded-xl border border-borderLine animate-pulse" />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Business Configuration & Tax Parameters"
        subtitle="Configure manufacturing company profile, GSTIN, place of supply rules, and variance tolerance defaults"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Settings' }]}
      />

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Business settings updated successfully.</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-borderLine p-6 shadow-xs">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Company Legal Name</label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Company GSTIN</label>
              <input
                type="text"
                required
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs font-mono font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Registered Factory / Office Address</label>
            <input
              type="text"
              required
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Home State</label>
              <input
                type="text"
                required
                value={settings.state}
                onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">State Code</label>
              <input
                type="text"
                required
                value={settings.state_code}
                onChange={(e) => setSettings({ ...settings, state_code: e.target.value })}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Current Financial Year</label>
              <input
                type="text"
                required
                value={settings.current_financial_year}
                onChange={(e) => setSettings({ ...settings, current_financial_year: e.target.value })}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">
                Default Production Variance Tolerance (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={settings.default_variance_tolerance}
                onChange={(e) =>
                  setSettings({ ...settings, default_variance_tolerance: parseFloat(e.target.value) || 3.0 })
                }
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs font-bold text-accent"
              />
              <p className="text-[10px] text-secondaryText mt-1">Default 3.0% benchmark tolerance</p>
            </div>
          </div>

          <div className="pt-4 border-t border-borderLine flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light disabled:opacity-50 shadow-xs"
            >
              {saving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
