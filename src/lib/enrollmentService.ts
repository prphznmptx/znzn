import { supabase } from './supabase';

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  price_paid: number;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_method: 'eversend' | 'flutterwave' | null;
  transaction_id: string | null;
  progress_percentage: number;
  lessons_completed: number;
  completed_at: string | null;
  status: 'active' | 'completed' | 'dropped';
  created_at: string;
  updated_at: string;
}

export interface EversendPaymentResponse {
  success: boolean;
  reference?: string;
  checkoutLink?: string;
  message?: string;
}

export interface FlutterwavePaymentResponse {
  status: string;
  data?: {
    link: string;
  };
  message?: string;
}

// Initialize Eversend payment
export async function initializeEversendPayment(
  courseId: string,
  amount: number,
  userEmail: string,
  userName: string,
  phoneNumber: string
): Promise<EversendPaymentResponse> {
  try {
    const response = await fetch('https://api.eversend.co/send/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_EVERSEND_API_KEY || ''}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'UGX',
        phoneNumber,
        email: userEmail,
        description: `Course Enrollment - ${courseId}`,
        externalId: courseId,
        metadata: {
          courseId,
          userName,
          type: 'course-enrollment',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to initialize Eversend payment',
      };
    }

    return {
      success: true,
      reference: data.reference,
      checkoutLink: data.checkoutLink || data.paymentLink,
    };
  } catch (error) {
    console.error('Eversend payment error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Payment initialization failed',
    };
  }
}

// Initialize Flutterwave payment (fallback)
export async function initializeFlutterwavePayment(
  courseId: string,
  amount: number,
  userEmail: string,
  userName: string
): Promise<FlutterwavePaymentResponse> {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_FLUTTERWAVE_SECRET_KEY || ''}`,
      },
      body: JSON.stringify({
        tx_ref: `course-${courseId}-${Date.now()}`,
        amount,
        currency: 'UGX',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: userEmail,
          name: userName,
        },
        customizations: {
          title: 'Course Enrollment',
          description: `Enrollment for course ${courseId}`,
          logo: 'https://yourapp.com/logo.png',
        },
        redirect_url: `${window.location.origin}/enrollment-callback?provider=flutterwave`,
        meta: {
          courseId,
          type: 'course-enrollment',
        },
      }),
    });

    const data = await response.json();

    if (data.status !== 'success') {
      return {
        status: 'error',
        message: data.message || 'Failed to initialize Flutterwave payment',
      };
    }

    return {
      status: 'success',
      data: {
        link: data.data.link,
      },
    };
  } catch (error) {
    console.error('Flutterwave payment error:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Payment initialization failed',
    };
  }
}

// Verify Eversend payment
export async function verifyEversendPayment(reference: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.eversend.co/send/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_EVERSEND_API_KEY || ''}`,
      },
    });

    const data = await response.json();
    return data.status === 'completed' || data.status === 'success';
  } catch (error) {
    console.error('Eversend verification error:', error);
    return false;
  }
}

// Verify Flutterwave payment
export async function verifyFlutterwavePayment(transactionId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_FLUTTERWAVE_SECRET_KEY || ''}`,
        },
      }
    );

    const data = await response.json();
    return data.status === 'success' && data.data.status === 'successful';
  } catch (error) {
    console.error('Flutterwave verification error:', error);
    return false;
  }
}

// Create or update enrollment in database
export async function createEnrollment(
  userId: string,
  courseId: string,
  pricePaid: number,
  paymentMethod: 'eversend' | 'flutterwave' | null,
  transactionId: string | null,
  paymentStatus: 'pending' | 'completed' | 'failed' = 'completed'
): Promise<{ success: boolean; enrollment?: CourseEnrollment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('student_enrollments')
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          price_paid: pricePaid,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          payment_status: paymentStatus,
          status: 'active',
        },
        { onConflict: 'user_id,course_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Enrollment creation error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, enrollment: data };
  } catch (error) {
    console.error('Enrollment creation exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create enrollment',
    };
  }
}

// Get user enrollments
export async function getUserEnrollments(userId: string): Promise<CourseEnrollment[]> {
  try {
    const { data, error } = await supabase
      .from('student_enrollments')
      .select('*')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments:', error.message || error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching enrollments:', error instanceof Error ? error.message : error);
    return [];
  }
}

// Check if user is enrolled in course
export async function isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('student_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking enrollment:', error.message || error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception checking enrollment:', error instanceof Error ? error.message : error);
    return false;
  }
}

// Update enrollment progress
export async function updateEnrollmentProgress(
  enrollmentId: string,
  progressPercentage: number,
  lessonsCompleted: number,
  isCompleted: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('student_enrollments')
      .update({
        progress_percentage: progressPercentage,
        lessons_completed: lessonsCompleted,
        status: isCompleted ? 'completed' : 'active',
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', enrollmentId);

    if (error) {
      console.error('Progress update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Progress update exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress',
    };
  }
}

// Get enrollment details
export async function getEnrollmentDetails(
  userId: string,
  courseId: string
): Promise<CourseEnrollment | null> {
  try {
    const { data, error } = await supabase
      .from('student_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching enrollment details:', error.message || error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Exception fetching enrollment details:', error instanceof Error ? error.message : error);
    return null;
  }
}
