import { supabase } from './supabase';

export interface PromoCode {
  id: string;
  code: string;
  discount_percentage?: number;
  discount_amount?: number;
  max_uses?: number;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  course_id?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface DiscountResult {
  valid: boolean;
  discount_percentage?: number;
  discount_amount?: number;
  final_price?: number;
  error?: string;
}

/**
 * Validate and apply promo code to an enrollment
 */
export async function validatePromoCode(
  code: string,
  courseId: string,
  originalPrice: number
): Promise<DiscountResult> {
  try {
    if (!code || !code.trim()) {
      return { valid: false, error: 'Promo code is required' };
    }

    // Call the database function to validate
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: code.trim().toUpperCase(),
      p_course_id: courseId,
    });

    if (error) {
      console.error('Promo code validation error:', error);
      return { valid: false, error: 'Failed to validate promo code' };
    }

    if (!data || data.length === 0 || !data[0].valid) {
      return {
        valid: false,
        error: 'Invalid or expired promo code',
      };
    }

    const promoData = data[0];
    let discountAmount = 0;

    // Calculate discount
    if (promoData.discount_percentage) {
      discountAmount = (originalPrice * promoData.discount_percentage) / 100;
    } else if (promoData.discount_amount) {
      discountAmount = promoData.discount_amount;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
      valid: true,
      discount_percentage: promoData.discount_percentage,
      discount_amount: promoData.discount_amount,
      final_price: finalPrice,
    };
  } catch (err) {
    console.error('Promo code validation exception:', err);
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Validation failed',
    };
  }
}

/**
 * Record promo code usage
 */
export async function applyPromoCodeToEnrollment(
  enrollmentId: string,
  promoCodeId: string,
  discountAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Add enrollment-promo code relationship
    const { error: insertError } = await supabase
      .from('enrollment_promo_codes')
      .insert([
        {
          enrollment_id: enrollmentId,
          promo_code_id: promoCodeId,
          discount_amount: discountAmount,
        },
      ]);

    if (insertError) {
      throw insertError;
    }

    // Increment promo code usage count
    const { error: updateError } = await supabase.rpc('increment_promo_usage', {
      p_promo_id: promoCodeId,
    });

    if (updateError && updateError.code !== 'PGRST116') {
      // Non-critical error if function doesn't exist
      console.warn('Could not increment promo usage:', updateError);
    }

    return { success: true };
  } catch (err) {
    console.error('Promo code application error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to apply promo code',
    };
  }
}

/**
 * Get all active promo codes (for display)
 */
export async function getActivePromoCodes(
  courseId?: string
): Promise<PromoCode[]> {
  try {
    let query = supabase
      .from('promo_codes')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', new Date().toISOString())
      .gt('valid_until', new Date().toISOString());

    if (courseId) {
      // Get promo codes for this course or all courses
      query = query.or(`course_id.is.null,course_id.eq.${courseId}`);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching promo codes:', err);
    return [];
  }
}

/**
 * Create promo code (admin function)
 */
export async function createPromoCode(
  code: string,
  discountPercentage: number | null,
  discountAmount: number | null,
  validFrom: Date,
  validUntil: Date,
  maxUses?: number,
  courseId?: string,
  userId?: string
): Promise<{ success: boolean; promoCode?: PromoCode; error?: string }> {
  try {
    if (!code || !code.trim()) {
      return { success: false, error: 'Code is required' };
    }

    if (!discountPercentage && !discountAmount) {
      return {
        success: false,
        error: 'Either discount percentage or amount is required',
      };
    }

    if (validFrom >= validUntil) {
      return { success: false, error: 'Valid from date must be before valid until date' };
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .insert([
        {
          code: code.trim().toUpperCase(),
          discount_percentage: discountPercentage,
          discount_amount: discountAmount,
          max_uses: maxUses || null,
          valid_from: validFrom.toISOString(),
          valid_until: validUntil.toISOString(),
          course_id: courseId || null,
          is_active: true,
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, promoCode: data };
  } catch (err) {
    console.error('Promo code creation error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create promo code',
    };
  }
}

/**
 * Update promo code status
 */
export async function updatePromoCodeStatus(
  promoCodeId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', promoCodeId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error('Promo code update error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update promo code',
    };
  }
}

/**
 * Check if course has an active discount
 */
export async function getCourseDiscount(courseId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('masterclass_page_content')
      .select('discount_percentage, discount_valid_until')
      .eq('id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (
      data?.discount_percentage &&
      data.discount_valid_until &&
      new Date(data.discount_valid_until) > new Date()
    ) {
      return data.discount_percentage;
    }

    return 0;
  } catch (err) {
    console.error('Error fetching course discount:', err);
    return 0;
  }
}

/**
 * Calculate final price with all discounts
 */
export function calculateFinalPrice(
  originalPrice: number,
  courseDiscount: number = 0,
  promoDiscount?: DiscountResult
): number {
  let finalPrice = originalPrice;

  // Apply course discount first
  if (courseDiscount > 0) {
    finalPrice -= (originalPrice * courseDiscount) / 100;
  }

  // Apply promo discount (overrides course discount if both exist)
  if (promoDiscount && promoDiscount.valid) {
    if (promoDiscount.discount_percentage) {
      finalPrice = originalPrice - (originalPrice * promoDiscount.discount_percentage) / 100;
    } else if (promoDiscount.discount_amount) {
      finalPrice = originalPrice - promoDiscount.discount_amount;
    }
  }

  return Math.max(0, finalPrice);
}
