import { useState, useCallback } from 'react';
import {
  createEnrollment,
  getUserEnrollments,
  isUserEnrolled,
  updateEnrollmentProgress,
  getEnrollmentDetails,
  initializeEversendPayment,
  initializeFlutterwavePayment,
  verifyEversendPayment,
  verifyFlutterwavePayment,
  CourseEnrollment,
  EversendPaymentResponse,
  FlutterwavePaymentResponse,
} from '../lib/enrollmentService';
import { createCertificate } from '../lib/certificateService';
import { createInvoice } from '../lib/invoiceService';

export function useEnrollment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);

  // Fetch user enrollments
  const fetchEnrollments = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserEnrollments(userId);
      setEnrollments(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch enrollments';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user is enrolled
  const checkEnrollment = useCallback(async (userId: string, courseId: string) => {
    try {
      return await isUserEnrolled(userId, courseId);
    } catch (err) {
      console.error('Error checking enrollment:', err);
      return false;
    }
  }, []);

  // Initialize payment and create enrollment
  const initiateEnrollment = useCallback(
    async (
      userId: string,
      courseId: string,
      amount: number,
      userEmail: string,
      userName: string,
      phoneNumber: string,
      useEversend: boolean = true
    ): Promise<{ success: boolean; paymentUrl?: string; error?: string; enrollmentId?: string }> => {
      try {
        setIsLoading(true);
        setError(null);

        // For free courses
        if (amount === 0) {
          const result = await createEnrollment(userId, courseId, 0, null, null, 'completed');
          if (result.success) {
            return { success: true, enrollmentId: result.enrollment?.id };
          }
          throw new Error(result.error || 'Failed to create enrollment');
        }

        // For paid courses - try Eversend first
        if (useEversend) {
          const eversendResult = await initializeEversendPayment(
            courseId,
            amount,
            userEmail,
            userName,
            phoneNumber
          );

          if (eversendResult.success && eversendResult.checkoutLink) {
            // Create pending enrollment
            const enrollmentResult = await createEnrollment(
              userId,
              courseId,
              amount,
              'eversend',
              eversendResult.reference || '',
              'pending'
            );

            if (enrollmentResult.success) {
              return {
                success: true,
                paymentUrl: eversendResult.checkoutLink,
                enrollmentId: enrollmentResult.enrollment?.id,
              };
            }
          }

          // Fallback to Flutterwave if Eversend fails
          console.log('Eversend payment failed, falling back to Flutterwave');
        }

        // Use Flutterwave
        const flutterwaveResult = await initializeFlutterwavePayment(
          courseId,
          amount,
          userEmail,
          userName
        );

        if (flutterwaveResult.status === 'success' && flutterwaveResult.data?.link) {
          // Create pending enrollment
          const enrollmentResult = await createEnrollment(
            userId,
            courseId,
            amount,
            'flutterwave',
            courseId,
            'pending'
          );

          if (enrollmentResult.success) {
            return {
              success: true,
              paymentUrl: flutterwaveResult.data.link,
              enrollmentId: enrollmentResult.enrollment?.id,
            };
          }
        }

        return {
          success: false,
          error:
            flutterwaveResult.message || 'Failed to initialize payment',
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Enrollment failed';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Verify payment and complete enrollment
  const verifyEnrollmentPayment = useCallback(
    async (
      enrollmentId: string,
      transactionId: string,
      paymentMethod: 'eversend' | 'flutterwave'
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        setError(null);

        let paymentVerified = false;

        if (paymentMethod === 'eversend') {
          paymentVerified = await verifyEversendPayment(transactionId);
        } else if (paymentMethod === 'flutterwave') {
          paymentVerified = await verifyFlutterwavePayment(transactionId);
        }

        if (!paymentVerified) {
          return { success: false, error: 'Payment verification failed' };
        }

        // Update enrollment status
        const { error: updateError } = await updateEnrollmentProgress(enrollmentId, 0, 0, false);

        if (updateError) {
          return { success: false, error: updateError };
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Verification failed';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update progress
  const updateProgress = useCallback(
    async (
      enrollmentId: string,
      progressPercentage: number,
      lessonsCompleted: number,
      isCompleted: boolean = false
    ) => {
      try {
        const result = await updateEnrollmentProgress(
          enrollmentId,
          progressPercentage,
          lessonsCompleted,
          isCompleted
        );
        if (!result.success) {
          setError(result.error || 'Failed to update progress');
        }
        return result.success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Progress update failed';
        setError(message);
        return false;
      }
    },
    []
  );

  // Get enrollment details
  const getDetails = useCallback(async (userId: string, courseId: string) => {
    try {
      return await getEnrollmentDetails(userId, courseId);
    } catch (err) {
      console.error('Error getting enrollment details:', err);
      return null;
    }
  }, []);

  // Generate certificate for completed course
  const generateCertificate = useCallback(
    async (
      enrollmentId: string,
      userId: string,
      courseId: string,
      courseName: string,
      userName: string,
      instructorName: string
    ) => {
      try {
        const result = await createCertificate(
          enrollmentId,
          userId,
          courseId,
          courseName,
          userName,
          instructorName
        );
        if (!result.success) {
          setError(result.error || 'Failed to generate certificate');
        }
        return result.success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Certificate generation failed';
        setError(message);
        return false;
      }
    },
    []
  );

  // Generate invoice for enrollment
  const generateInvoice = useCallback(
    async (
      enrollmentId: string,
      userId: string,
      courseId: string,
      amount: number,
      paymentMethod?: string,
      transactionId?: string
    ) => {
      try {
        const result = await createInvoice(
          enrollmentId,
          userId,
          courseId,
          amount,
          paymentMethod,
          transactionId
        );
        if (!result.success) {
          setError(result.error || 'Failed to create invoice');
        }
        return result.success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invoice creation failed';
        setError(message);
        return false;
      }
    },
    []
  );

  return {
    enrollments,
    isLoading,
    error,
    fetchEnrollments,
    checkEnrollment,
    initiateEnrollment,
    verifyEnrollmentPayment,
    updateProgress,
    getDetails,
    generateCertificate,
    generateInvoice,
  };
}
