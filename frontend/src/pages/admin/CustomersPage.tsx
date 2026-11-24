import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Customer } from '../../types';
import { Users, Plus } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [stateCode, setStateCode] = useState('33');
  const [gstin, setGstin] = useState('');
  const [type, setType] = useState<'RETAILER' | 'DISTRIBUTOR'>('RETAILER');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', {
        customer_name: name,
        mobile,
        billing_address: address,
        shipping_address: address,
        state,
        state_code: stateCode,
        gstin,
        customer_type: type,
      });
      setIsModalOpen(false);
      setName('');
      setMobile('');
      fetchCustomers();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to create customer');
    }
  };

  const columns = [
    {
      header: 'Code & Name',
      accessor: (row: Customer) => (
        <div>
          <span className="font-semibold text-mainText">{row.customer_name}</span>
          <span className="block text-[11px] text-secondaryText font-mono">{row.customer_code}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (row: Customer) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {row.customer_type}
        </span>
      ),
    },
    {
      header: 'Location / State',
      accessor: (row: Customer) => (
        <div>
          <span className="text-xs text-mainText">{row.state}</span>
          <span className="block text-[11px] text-secondaryText">Code: {row.state_code}</span>
        </div>
      ),
    },
    {
      header: 'GSTIN',
      accessor: (row: Customer) => (
        <span className="font-mono text-xs text-secondaryText">{row.gstin || 'Unregistered'}</span>
      ),
    },
    {
      header: 'Assigned Salesman',
      accessor: (row: Customer) => (
        <span className="text-xs text-mainText">{row.salesman_name || 'Unassigned'}</span>
      ),
    },
    {
      header: 'Credit Limit',
      accessor: (row: Customer) => (
        <span className="text-xs font-semibold text-mainText">₹{row.credit_limit.toFixed(2)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        subtitle="Retailers and distributors with state-based GST configuration and assigned salesmen"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Customers' }]}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Customer
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        searchKey="customer_name"
        searchPlaceholder="Search customer name or code..."
        isLoading={loading}
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer"
        subtitle="Add retailer or distributor account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Customer / Store Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Madurai Supermart"
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Mobile Number</label>
              <input
                type="text"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Customer Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs bg-white"
              >
                <option value="RETAILER">Retailer</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">State Code</label>
              <input
                type="text"
                required
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                placeholder="33"
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Billing & Delivery Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Store address, street, city..."
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-mainText mb-1">GSTIN (Optional)</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="33AAAAA0000A1Z5"
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs font-mono"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-borderLine">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-borderLine text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
