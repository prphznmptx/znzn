import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useEnrollment } from '../hooks/useEnrollment';

export default function EnrollmentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEnrollmentPayment } = useEnrollment();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get pending enrollment info from sessionStorage
        const pendingStr = sessionStorage.getItem('pendingEnrollment');
        if (!pendingStr) {
          setStatus('error');
          setMessage('Enrollment session not found. Please try again.');
          return;
        }

        const pending = JSON.parse(pendingStr);
        const transactionId = searchParams.get('transaction_id') || searchParams.get('tx_ref');

        if (!transactionId) {
          setStatus('error');
          setMessage('No transaction ID found. Please contact support.');
          return;
        }

        // Verify payment
        const result = await verifyEnrollmentPayment(
          pending.enrollmentId,
          transactionId,
          pending.paymentMethod
        );

        if (result.success) {
          setStatus('success');
          setMessage('Payment verified! Your enrollment is complete.');

          // Clear pending enrollment
          sessionStorage.removeItem('pendingEnrollment');

          // Redirect to course in 3 seconds
          setTimeout(() => {
            navigate(`/course/${pending.courseId}`);
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Payment verification failed. Please try again.');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'An error occurred during verification.');
      }
    };

    verifyPayment();
  }, [searchParams, verifyEnrollmentPayment, navigate]);

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md mx-auto">
        <div className="glass-effect p-8 rounded-2xl text-center">
          {status === 'verifying' && (
            <>
              <Loader className="w-12 h-12 text-rose-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold text-lg">{message}</p>
              <p className="text-gray-400 text-sm mt-2">Please wait, do not close this window.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white font-semibold text-lg">{message}</p>
              <p className="text-gray-400 text-sm mt-2">Redirecting to your course...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white font-semibold text-lg mb-2">Enrollment Failed</p>
              <p className="text-gray-300 text-sm mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/masterclass')}
                  className="w-full px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Back to Courses
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
