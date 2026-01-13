import React, { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, AlertCircle, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../hooks/useEnrollment';
import { supabase } from '../lib/supabase';
import { validatePromoCode } from '../lib/promoCodeService';

interface Course {
  id: string;
  title: string;
  thumbnail_url: string;
  is_premium: boolean;
  creator: string;
}

interface EnrollmentModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onEnrollmentComplete: () => void;
}

type Step = 'details' | 'payment' | 'processing' | 'success' | 'error';

export default function EnrollmentModal({
  course,
  isOpen,
  onClose,
  onEnrollmentComplete,
}: EnrollmentModalProps) {
  const { user, profile } = useAuth();
  const { initiateEnrollment, isLoading, error } = useEnrollment();

  const [step, setStep] = useState<Step>('details');
  const [formData, setFormData] = useState({
    firstName: profile?.name?.split(' ')[0] || '',
    lastName: profile?.name?.split(' ')[1] || '',
    email: profile?.email || '',
    phoneNumber: '',
    acceptTerms: false,
  });
  const [coursePrice, setCoursePrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'eversend' | 'flutterwave'>('eversend');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<{ percentage?: number; amount?: number } | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);

  // Fetch course price from database
  useEffect(() => {
    if (!isOpen || !course.id) return;

    const fetchCoursePrice = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('masterclass_page_content')
          .select('course_price')
          .eq('id', course.id)
          .single();

        if (!fetchError && data) {
          setCoursePrice(data.course_price || 0);
          setFinalPrice(data.course_price || 0);
        }
      } catch (err) {
        console.error('Error fetching course price:', err);
        setCoursePrice(0); // Default to free if error
        setFinalPrice(0);
      }
    };

    fetchCoursePrice();
  }, [isOpen, course.id]);

  // Validate promo code
  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Enter a promo code');
      return;
    }

    setPromoValidating(true);
    setPromoError(null);

    const result = await validatePromoCode(promoCode, course.id, coursePrice);

    if (result.valid && result.final_price !== undefined) {
      setPromoDiscount({
        percentage: result.discount_percentage,
        amount: result.discount_amount,
      });
      setFinalPrice(result.final_price);
      setPromoError(null);
    } else {
      setPromoError(result.error || 'Invalid promo code');
      setPromoDiscount(null);
      setFinalPrice(coursePrice);
    }

    setPromoValidating(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setErrorMessage('First name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setErrorMessage('Email is required');
      return false;
    }
    if (coursePrice > 0 && !formData.phoneNumber.trim()) {
      setErrorMessage('Phone number is required for paid courses');
      return false;
    }
    if (!formData.acceptTerms) {
      setErrorMessage('You must accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleProceedToPayment = () => {
    setErrorMessage(null);
    if (!validateForm()) return;

    // For free courses, skip payment step and go straight to processing
    if (coursePrice === 0) {
      handlePayment();
    } else {
      // For paid courses, show payment method selection
      setStep('payment');
    }
  };

  const handlePayment = async () => {
    if (!user) {
      setErrorMessage('User not authenticated');
      return;
    }

    setErrorMessage(null);

    // Check if migrations have been run by testing a simple query
    try {
      const { error: testError } = await supabase
        .from('student_enrollments')
        .select('id')
        .limit(1);

      if (testError && testError.code === 'PGRST116') {
        // Table doesn't exist - migrations not run
        setErrorMessage('Database setup required. Please run the 3 SQL migrations from the database folder first.');
        setStep('error');
        return;
      }
    } catch (err) {
      console.error('Database check failed:', err);
    }

    setStep('processing');

    try {
      const userName = `${formData.firstName} ${formData.lastName}`.trim();

      const result = await initiateEnrollment(
        user.id,
        course.id,
        finalPrice, // Use finalPrice with any promo discount applied
        formData.email,
        userName,
        formData.phoneNumber,
        paymentMethod === 'eversend'
      );

      if (!result.success) {
        setErrorMessage(result.error || 'Payment initialization failed');
        setStep('error');
        return;
      }

      setEnrollmentId(result.enrollmentId || null);

      // If free course or payment link not generated, complete enrollment
      if (!result.paymentUrl) {
        setStep('success');
        setTimeout(() => {
          onEnrollmentComplete();
          onClose();
        }, 2000);
        return;
      }

      // For paid courses, redirect to payment provider
      if (result.paymentUrl) {
        // Store pending enrollment info in sessionStorage for verification callback
        sessionStorage.setItem(
          'pendingEnrollment',
          JSON.stringify({
            enrollmentId: result.enrollmentId,
            courseId: course.id,
            userId: user.id,
            paymentMethod,
          })
        );

        // Redirect to payment provider
        window.location.href = result.paymentUrl;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setErrorMessage(message);
      setStep('error');
    }
  };

  const handleClose = () => {
    if (step !== 'processing') {
      setStep('details');
      setFormData({
        firstName: profile?.name?.split(' ')[0] || '',
        lastName: profile?.name?.split(' ')[1] || '',
        email: profile?.email || '',
        phoneNumber: '',
        acceptTerms: false,
      });
      setErrorMessage(null);
      setEnrollmentId(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-effect p-6 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {step === 'details' && 'Enrollment Details'}
            {step === 'payment' && (coursePrice > 0 ? 'Choose Payment Method' : 'Complete Enrollment')}
            {step === 'processing' && 'Processing...'}
            {step === 'success' && 'Enrollment Complete!'}
            {step === 'error' && 'Enrollment Failed'}
          </h2>
          <button
            onClick={handleClose}
            disabled={step === 'processing'}
            className="p-1 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Course Summary */}
        {step !== 'success' && step !== 'error' && (
          <div className="mb-6 p-4 bg-purple-400/10 rounded-lg">
            <div className="flex gap-4 mb-3">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-16 h-16 rounded object-cover"
              />
              <div>
                <h3 className="text-white font-semibold text-sm">{course.title}</h3>
                <p className="text-gray-400 text-xs mt-1">by {course.creator}</p>
                {coursePrice > 0 && (
                  <div className="mt-2 space-y-1">
                    {promoDiscount ? (
                      <>
                        <p className="text-gray-400 text-xs line-through">UGX {coursePrice.toLocaleString()}</p>
                        <p className="text-green-400 font-bold text-sm">UGX {finalPrice.toLocaleString()}</p>
                      </>
                    ) : (
                      <p className="text-rose-400 font-bold text-sm">UGX {coursePrice.toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Details Form */}
        {step === 'details' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProceedToPayment();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-white mb-2">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                placeholder="Enter your first name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                placeholder="Enter your last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            {coursePrice > 0 && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  placeholder="+256..."
                  required={coursePrice > 0}
                />
              </div>
            )}

            {coursePrice > 0 && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Promo Code (Optional)</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError(null);
                        setPromoDiscount(null);
                        setFinalPrice(coursePrice);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                      placeholder="Enter promo code"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleValidatePromo}
                    disabled={promoValidating || !promoCode.trim()}
                    className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {promoValidating ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-400 text-xs mt-1">{promoError}</p>
                )}
                {promoDiscount && (
                  <p className="text-green-400 text-xs mt-1">✓ Promo code applied!</p>
                )}
              </div>
            )}

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 rounded border-gray-700 bg-gray-900 text-rose-500 focus:ring-rose-400"
                required
              />
              <label className="text-sm text-gray-300">
                I accept the{' '}
                <a href="#" className="text-rose-400 hover:underline">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-rose-400 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all"
            >
              {coursePrice === 0 ? 'Complete Enrollment' : promoDiscount ? `Proceed to Payment - UGX ${finalPrice.toLocaleString()}` : `Proceed to Payment - UGX ${coursePrice.toLocaleString()}`}
            </button>
          </form>
        )}

        {/* Step 2: Payment Method Selection or Free Course Confirmation */}
        {step === 'payment' && (
          <div className="space-y-4">
            {coursePrice > 0 ? (
              <>
                <p className="text-gray-300 text-sm mb-4">Select your preferred payment method:</p>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-700 rounded-lg cursor-pointer hover:border-rose-400 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="eversend"
                      checked={paymentMethod === 'eversend'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'eversend')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-white font-semibold">Eversend</p>
                      <p className="text-gray-400 text-xs">Mobile money, card, bank transfer</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 border-gray-700 rounded-lg cursor-pointer hover:border-rose-400 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="flutterwave"
                      checked={paymentMethod === 'flutterwave'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'flutterwave')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-white font-semibold">Flutterwave</p>
                      <p className="text-gray-400 text-xs">Card, mobile money, bank transfer</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => setStep('details')}
                    className="w-full py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Pay Now'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-center py-8">This course is free. Click below to complete your enrollment.</p>
                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => setStep('details')}
                    className="w-full py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Complete Enrollment'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-12 h-12 text-rose-400 animate-spin mb-4" />
            <p className="text-white text-center">Processing your enrollment...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait, do not close this window</p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
            <p className="text-gray-300 mb-4">
              You've successfully enrolled in {course.title}
            </p>
            <p className="text-gray-400 text-sm">Redirecting you to the course...</p>
          </div>
        )}

        {/* Step 5: Error */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <p className="text-white text-center font-semibold">Enrollment Failed</p>
            {errorMessage && (
              <p className="text-gray-300 text-center text-sm">{errorMessage}</p>
            )}

            <div className="space-y-2 pt-4">
              <button
                onClick={() => setStep('details')}
                className="w-full py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="w-full py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
