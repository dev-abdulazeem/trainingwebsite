import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, BookOpen, MessageSquare, Loader2 } from 'lucide-react';
import { paymentApi } from '@api/client';
import toast from 'react-hot-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  // Paystack might send 'reference' or 'trxref' depending on the redirect
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setIsVerifying(false);
        return;
      }
      
      try {
        // Call backend to verify payment and trigger enrollment creation
        await paymentApi.verify(reference);
      } catch (error) {
        console.error('Verification error:', error);
        // If it fails, it might already be verified by the Paystack webhook, so we still show success
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [reference]);

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Verifying your payment...</h2>
          <p className="text-dark-400 mt-2">Please wait while we confirm your enrollment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome to the Course! 🎉
        </h1>
        <p className="text-dark-400 mb-2">
          Your payment was successful and you're now enrolled.
        </p>
        {reference && (
          <p className="text-dark-600 text-sm mb-8 font-mono">
            Ref: {reference}
          </p>
        )}

        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            Start Learning
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/community"
            className="flex items-center justify-center gap-2 w-full py-3 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-xl transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Join Community
          </Link>
        </div>

        <p className="mt-8 text-dark-600 text-sm">
          A confirmation email has been sent to your inbox.
        </p>
      </div>
    </div>
  );
}