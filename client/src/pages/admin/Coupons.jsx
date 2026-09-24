import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponApi } from '@api/client';
import {
  Plus,
  Tag,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Percent,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'FIXED',
    discountValue: '',
    maxUses: '',
    expiryDate: '',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponApi.list().then((res) => res.data),
  });

  const createCoupon = useMutation({
    mutationFn: (data) => couponApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowForm(false);
      resetForm();
      toast.success('Coupon created!');
    },
  });

  const updateCoupon = useMutation({
    mutationFn: ({ id, data }) => couponApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
      toast.success('Coupon updated!');
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: (id) => couponApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted!');
    },
  });

  const toggleCoupon = useMutation({
    mutationFn: (id) => couponApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon status toggled!');
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'FIXED',
      discountValue: '',
      maxUses: '',
      expiryDate: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      discountValue: parseFloat(formData.discountValue),
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      expiryDate: formData.expiryDate || null,
    };

    if (editingCoupon) {
      updateCoupon.mutate({ id: editingCoupon.id, data: payload });
    } else {
      createCoupon.mutate(payload);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      maxUses: coupon.maxUses?.toString() || '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
    });
    setShowForm(true);
  };

  const coupons = data?.coupons || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Coupons</h1>
          <p className="text-dark-400">Create and manage discount codes</p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-dark-900 border border-dark-800 rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white uppercase focus:border-primary-500 transition-colors"
                placeholder="FIRST20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
              >
                <option value="FIXED">Fixed Amount (₦)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Discount Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₦)'}
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Max Uses (optional)</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
                placeholder="Unlimited"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Expiry Date (optional)</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full sm:w-auto bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={createCoupon.isPending || updateCoupon.isPending}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white font-medium rounded-lg transition-colors"
          >
            {createCoupon.isPending || updateCoupon.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editingCoupon ? (
              'Update Coupon'
            ) : (
              'Create Coupon'
            )}
          </button>
        </form>
      )}

      {/* Coupons Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-800">
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Code</th>
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Type</th>
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Value</th>
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Usage</th>
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Expires</th>
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Status</th>
                <th className="text-right text-dark-400 text-sm font-medium px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-dark-500">
                    No coupons created yet
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-dark-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary-400" />
                        <span className="text-white font-mono font-medium">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        coupon.discountType === 'PERCENTAGE' ? 'bg-primary-500/10 text-primary-400' : 'bg-dark-700 text-dark-300'
                      }`}>
                        {coupon.discountType === 'PERCENTAGE' ? (
                          <Percent className="w-3 h-3" />
                        ) : (
                          <Hash className="w-3 h-3" />
                        )}
                        {coupon.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.discountValue}%`
                        : `₦${Number(coupon.discountValue).toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-dark-400 text-sm">
                        {coupon.usedCount} / {coupon.maxUses || '∞'}
                      </span>
                      {coupon.maxUses && (
                        <div className="mt-1 h-1.5 w-24 bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 rounded-full"
                            style={{ width: `${Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-dark-400 text-sm">
                      {coupon.expiryDate
                        ? new Date(coupon.expiryDate).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleCoupon.mutate(coupon.id)}
                        className="transition-colors"
                      >
                        {coupon.isActive ? (
                          <ToggleRight className="w-6 h-6 text-success-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-dark-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-1.5 text-dark-400 hover:text-primary-400 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this coupon?')) deleteCoupon.mutate(coupon.id);
                          }}
                          className="p-1.5 text-dark-400 hover:text-danger-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}