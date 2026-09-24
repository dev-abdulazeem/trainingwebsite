import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { courseApi, paymentApi, couponApi } from '@api/client';
import { useAuthStore } from '@store/authStore';
import {
  CreditCard,
  Tag,
  Check,
  Loader2,
  ArrowRight,
  Shield,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.list().then((res) => res.data),
  });

  const course = coursesData?.courses?.[0];
  const originalPrice = course?.price || 15000;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await couponApi.validate(couponCode, course?.id);
      setAppliedCoupon(res.data.coupon);
      toast.success('Coupon applied!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalPrice = appliedCoupon?.finalPrice || originalPrice;

  const initializePayment = useMutation({
    mutationFn: () =>
      paymentApi.initialize({
        courseId: course?.id,
        couponCode: appliedCoupon?.code,
      }),
    onSuccess: (res) => {
      // Redirect to Paystack
      window.location.href = res.data.authorizationUrl;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Payment initialization failed');
    },
  });

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Purchase</h1>
          <p className="text-dark-400">You're one step away from starting your journey</p>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
          {/* Order Summary */}
          <div className="p-6 border-b border-dark-800">
            <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-primary-600/10 rounded-lg flex items-center justify-center shrink-0">
                <CreditCard className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">{course.title}</h3>
                <p className="text-dark-500 text-sm">Full lifetime access</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-dark-400">
                <span>Course Price</span>
                <span>₦{Number(originalPrice).toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-success-500">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₦{Number(discountAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-dark-800 pt-2 flex justify-between text-white font-semibold text-base">
                <span>Total</span>
                <span>₦{Number(finalPrice).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Coupon */}
          <div className="p-6 border-b border-dark-800">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Have a coupon?
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-dark-600 focus:border-primary-500 transition-colors disabled:opacity-50 uppercase"
                  placeholder="FIRST20"
                />
              </div>
              {appliedCoupon ? (
                <button
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode('');
                  }}
                  className="px-4 py-2.5 text-danger-500 hover:text-danger-400 text-sm font-medium transition-colors"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={validateCoupon}
                  disabled={validatingCoupon || !couponCode}
                  className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4 text-dark-500 text-sm">
              <Shield className="w-4 h-4" />
              <span>Secure payment via Paystack</span>
            </div>

            <button
              onClick={() => initializePayment.mutate()}
              disabled={initializePayment.isPending}
              className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {initializePayment.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ₦{Number(finalPrice).toLocaleString()}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-dark-500 text-xs">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                SSL Secure
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                7-Day Refund
              </span>
            </div>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="mt-6 p-4 bg-dark-900/50 border border-dark-800 rounded-xl">
          <h3 className="text-sm font-medium text-white mb-2">7-Day Refund Guarantee</h3>
          <p className="text-dark-500 text-xs leading-relaxed">
            Students can request a refund within 7 days of purchase, subject to our stated conditions. 
            Course and community access will be revoked after the refund is processed.
          </p>
        </div>
      </div>
    </div>
  );
}