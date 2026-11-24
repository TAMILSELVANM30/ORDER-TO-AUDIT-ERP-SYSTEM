import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { ShieldAlert, AlertCircle, FileText } from 'lucide-react';

export const GSTReportPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGst = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/gst');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchGst();
  }, []);

  if (loading || !data) {
    return <div className="h-64 bg-white rounded-xl border border-borderLine animate-pulse" />;
  }

  const intra = data.intra_state_b2b_b2c || {};
  const inter = data.inter_state_b2b_b2c || {};
  const summary = data.summary || {};

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="GST Outward Supplies & GSTR-1 / 3B Review"
        subtitle="Consolidated statutory tax summary segregated by place of supply and GST tax heads"
        breadcrumbs={[{ label: 'Auditor' }, { label: 'GST Summary' }]}
      />

      {/* Mandatory Statutory Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-borderLine flex items-start space-x-3 text-xs text-secondaryText">
        <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-mainText">Statutory Compliance Note:</p>
          <p className="mt-0.5">{data.disclaimer}</p>
        </div>
      </div>

      {/* Grand Tax Liability Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-borderLine shadow-2xs">
          <p className="text-xs text-secondaryText uppercase tracking-wider font-semibold">Total Taxable Value</p>
          <p className="text-xl font-bold text-mainText mt-1">₹{summary.total_taxable_value?.toFixed(2)}</p>
          <p className="text-[11px] text-secondaryText mt-0.5">{summary.invoice_count} Invoices in period</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-borderLine shadow-2xs">
          <p className="text-xs text-secondaryText uppercase tracking-wider font-semibold">Central Tax (CGST)</p>
          <p className="text-xl font-bold text-accent mt-1">₹{summary.total_cgst?.toFixed(2)}</p>
          <p className="text-[11px] text-secondaryText mt-0.5">2.5% on Intra-State (TN)</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-borderLine shadow-2xs">
          <p className="text-xs text-secondaryText uppercase tracking-wider font-semibold">State Tax (SGST)</p>
          <p className="text-xl font-bold text-accent mt-1">₹{summary.total_sgst?.toFixed(2)}</p>
          <p className="text-[11px] text-secondaryText mt-0.5">2.5% on Intra-State (TN)</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-borderLine shadow-2xs">
          <p className="text-xs text-secondaryText uppercase tracking-wider font-semibold">Integrated Tax (IGST)</p>
          <p className="text-xl font-bold text-primary mt-1">₹{summary.total_igst?.toFixed(2)}</p>
          <p className="text-[11px] text-secondaryText mt-0.5">5.0% on Inter-State Supply</p>
        </div>
      </div>

      {/* Table 1: GSTR-1 Table 4/5 Outward Supplies */}
      <div className="bg-white rounded-xl border border-borderLine overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-borderLine">
          <h3 className="text-sm font-semibold text-mainText">GSTR-1 Outward Supplies Categorization</h3>
          <p className="text-xs text-secondaryText">B2B and B2C supplies split by Place of Supply rules</p>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/50 text-secondaryText border-b border-borderLine">
            <tr>
              <th className="px-4 py-3 font-semibold">Supply Category</th>
              <th className="px-4 py-3 font-semibold">Nature of Supply</th>
              <th className="px-4 py-3 font-semibold text-right">Taxable Value</th>
              <th className="px-4 py-3 font-semibold text-right">CGST (2.5%)</th>
              <th className="px-4 py-3 font-semibold text-right">SGST (2.5%)</th>
              <th className="px-4 py-3 font-semibold text-right">IGST (5.0%)</th>
              <th className="px-4 py-3 font-semibold text-right">Total Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderLine">
            <tr>
              <td className="px-4 py-3 font-medium text-mainText">Intra-State Outward Supply (Tamil Nadu)</td>
              <td className="px-4 py-3 text-secondaryText">Within Tamil Nadu (Code 33)</td>
              <td className="px-4 py-3 text-right font-medium">₹{intra.taxable_value?.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{intra.cgst?.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{intra.sgst?.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-secondaryText">-</td>
              <td className="px-4 py-3 text-right font-bold text-emerald-700">₹{intra.total_tax?.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-mainText">Inter-State Outward Supply (Karnataka & Others)</td>
              <td className="px-4 py-3 text-secondaryText">Outside Tamil Nadu (e.g. Code 29)</td>
              <td className="px-4 py-3 text-right font-medium">₹{inter.taxable_value?.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-secondaryText">-</td>
              <td className="px-4 py-3 text-right text-secondaryText">-</td>
              <td className="px-4 py-3 text-right font-medium">₹{inter.igst?.toFixed(2)}</td>
              <td className="px-4 py-3 text-right font-bold text-emerald-700">₹{inter.total_tax?.toFixed(2)}</td>
            </tr>
            <tr className="bg-slate-50/80 font-bold text-mainText">
              <td colSpan={2} className="px-4 py-3">Total Consolidated Outward Tax Liability</td>
              <td className="px-4 py-3 text-right">₹{summary.total_taxable_value?.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{summary.total_cgst?.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{summary.total_sgst?.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{summary.total_igst?.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-primary font-extrabold">₹{summary.total_tax?.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GSTReportPage;
