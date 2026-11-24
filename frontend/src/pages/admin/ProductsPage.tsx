import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Product } from '../../types';
import { Package, Plus, ImageIcon } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import DocumentAttachmentModal from '../../components/common/DocumentAttachmentModal';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [packSize, setPackSize] = useState('200');
  const [sellingPrice, setSellingPrice] = useState('50.00');
  const [gstRate, setGstRate] = useState('5.00');
  const [hsnCode, setHsnCode] = useState('1905');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/products', {
        name,
        sku,
        pack_size: parseFloat(packSize),
        selling_price: parseFloat(sellingPrice),
        gst_rate: parseFloat(gstRate),
        hsn_code: hsnCode,
        uom: 'packet',
        min_stock_level: 20,
      });
      setIsModalOpen(false);
      setName('');
      setSku('');
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create product');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Product Name',
      accessor: (row: Product) => (
        <div>
          <span className="font-semibold text-mainText">{row.name}</span>
          <span className="block text-[11px] text-secondaryText">{row.description || 'Packaged Snack'}</span>
        </div>
      ),
    },
    {
      header: 'SKU',
      accessor: (row: Product) => <span className="font-mono text-xs">{row.sku}</span>,
    },
    {
      header: 'Pack Size',
      accessor: (row: Product) => <span>{row.pack_size} {row.pack_unit}</span>,
    },
    {
      header: 'HSN',
      accessor: (row: Product) => <span className="text-secondaryText font-mono">{row.hsn_code}</span>,
    },
    {
      header: 'Price (pre-tax)',
      accessor: (row: Product) => <span className="font-bold text-mainText">₹{row.selling_price.toFixed(2)}</span>,
    },
    {
      header: 'GST %',
      accessor: (row: Product) => <span className="text-xs">{row.gst_rate}%</span>,
    },
    {
      header: 'Finished Stock',
      accessor: (row: Product) => (
        <span className={`font-semibold ${row.current_stock > 20 ? 'text-emerald-700' : 'text-amber-700'}`}>
          {row.current_stock} packets
        </span>
      ),
    },
    {
      header: 'Product Image',
      accessor: (row: Product) => (
        <button
          onClick={() => {
            setSelectedProduct(row);
            setIsImageModalOpen(true);
          }}
          className="inline-flex items-center px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-medium border border-teal-200 transition-colors"
          title="Upload or View Public Product Picture"
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1" />
          Image
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finished Goods Product Catalog"
        subtitle="Manage master SKU specifications, pack sizes, selling rates, and HSN codes"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Products' }]}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Product
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={products}
        searchKey="name"
        searchPlaceholder="Search product name or SKU..."
        isLoading={loading}
      />

      {/* Add Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Finished Good SKU"
        subtitle="Configure new manufactured food item"
        maxWidth="md"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mainText mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ribbon Murukku 200 g"
              className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. RBN-200G"
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Pack Size (g)</label>
              <input
                type="number"
                required
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">GST Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mainText mb-1">HSN Code</label>
              <input
                type="text"
                required
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="w-full px-3 py-1.5 border border-borderLine rounded-lg text-xs font-mono"
              />
            </div>
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
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Supabase Storage Product Image Modal */}
      {selectedProduct && (
        <DocumentAttachmentModal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setSelectedProduct(null);
          }}
          referenceId={selectedProduct.id}
          referenceTitle={`Product Image — ${selectedProduct.name} (${selectedProduct.sku})`}
          documentType="product_image"
          canUpload={true}
          canDelete={true}
        />
      )}
    </div>
  );
};

export default ProductsPage;
