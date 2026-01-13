-- Create function to increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_usage(p_promo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1
  WHERE id = p_promo_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get promo code details
CREATE OR REPLACE FUNCTION get_promo_code_details(p_code text)
RETURNS TABLE(
  id uuid,
  code text,
  discount_percentage numeric,
  discount_amount numeric,
  is_valid boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.code,
    pc.discount_percentage,
    pc.discount_amount,
    (pc.is_active AND pc.valid_from <= now() AND pc.valid_until > now() AND (pc.current_uses < pc.max_uses OR pc.max_uses IS NULL))::boolean as is_valid
  FROM public.promo_codes pc
  WHERE UPPER(pc.code) = UPPER(p_code);
END;
$$ LANGUAGE plpgsql;

-- Create function to apply multiple discount types (course discount + promo code)
CREATE OR REPLACE FUNCTION calculate_enrollment_price(
  p_course_id uuid,
  p_promo_code text DEFAULT NULL
)
RETURNS TABLE(
  base_price numeric,
  course_discount numeric,
  promo_discount numeric,
  final_price numeric
) AS $$
DECLARE
  v_base_price numeric;
  v_course_discount_pct numeric;
  v_promo_discount numeric := 0;
BEGIN
  -- Get base course price
  SELECT course_price INTO v_base_price
  FROM public.masterclass_page_content
  WHERE id = p_course_id;
  
  v_base_price := COALESCE(v_base_price, 0);
  
  -- Get course discount if active
  SELECT discount_percentage INTO v_course_discount_pct
  FROM public.masterclass_page_content
  WHERE id = p_course_id 
  AND discount_percentage > 0 
  AND (discount_valid_until IS NULL OR discount_valid_until > now());
  
  v_course_discount_pct := COALESCE(v_course_discount_pct, 0);
  
  -- Get promo code discount if provided
  IF p_promo_code IS NOT NULL THEN
    SELECT COALESCE(discount_percentage, 0) INTO v_promo_discount
    FROM public.promo_codes pc
    WHERE UPPER(pc.code) = UPPER(p_promo_code)
    AND pc.is_active
    AND pc.valid_from <= now()
    AND pc.valid_until > now()
    AND (pc.current_uses < pc.max_uses OR pc.max_uses IS NULL);
    
    v_promo_discount := COALESCE(v_promo_discount, 0);
  END IF;
  
  -- Return price breakdown
  RETURN QUERY
  SELECT
    v_base_price as base_price,
    v_base_price * (v_course_discount_pct / 100) as course_discount,
    v_base_price * (v_promo_discount / 100) as promo_discount,
    v_base_price - (v_base_price * (GREATEST(v_course_discount_pct, v_promo_discount) / 100)) as final_price;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions if needed
GRANT EXECUTE ON FUNCTION increment_promo_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_promo_code_details(text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_promo_code(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_enrollment_price(uuid, text) TO authenticated;
