# Course Enrollment Payment Integration Setup

This guide explains how to set up Eversend and Flutterwave payment integration for the course enrollment system.

## Environment Variables

Add the following environment variables to your `.env.local` file or configure them in your deployment platform:

### Eversend (Primary Payment Provider)

```
VITE_EVERSEND_API_KEY=your_eversend_api_key_here
VITE_EVERSEND_BUSINESS_ID=your_eversend_business_id_here
```

Get your Eversend API key:
1. Go to https://eversend.co (sign up if needed)
2. Navigate to Settings → API Keys
3. Create a new API key
4. Copy the key and add it to your environment variables

### Flutterwave (Fallback Payment Provider)

```
VITE_FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key_here
VITE_FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key_here
```

Get your Flutterwave API keys:
1. Go to https://flutterwave.com/dashboard (sign up if needed)
2. Navigate to Settings → API Keys
3. Copy your Secret Key and Public Key
4. Add them to your environment variables

## Database Setup

The enrollment system requires the following database tables:

1. **student_enrollments** - Tracks user enrollments and payment status
   - See: `database/013_create_student_enrollments.sql`

2. **masterclass_page_content** updates:
   - Added `course_price` column for course pricing
   - See: `database/014_add_course_price_to_masterclass.sql`

## Deployment Configuration

### For Vercel / Netlify

Add environment variables in your deployment platform's settings:
- Dashboard Settings → Environment Variables
- Add all `VITE_*` variables listed above

### For Self-Hosted

Update your `.env` file and ensure it's in `.gitignore` to avoid committing secrets.

## Testing Payment Flow

### Eversend Test Mode

Eversend provides sandbox/test environment. Contact Eversend support for test credentials.

### Flutterwave Test Cards

Use these test cards in Flutterwave sandbox:

- **Card**: 4242 4242 4242 4242
- **Expiry**: 09/32
- **CVV**: 242
- **PIN**: 1111

## Payment Flow Overview

### Free Courses
1. User clicks "Enroll Now"
2. EnrollmentModal displays enrollment details
3. User provides contact information
4. Enrollment is created immediately (no payment processing)
5. User is redirected to Learning tab

### Paid Courses
1. User clicks "Enroll Now"
2. EnrollmentModal displays enrollment details
3. User selects payment method (Eversend or Flutterwave)
4. User is redirected to payment provider
5. After payment completion, user is redirected to `/enrollment-callback`
6. Payment is verified and enrollment is activated
7. User is redirected to the course page

## Webhook Configuration

### Eversend Webhooks

Configure the following webhook URL in your Eversend dashboard:
```
https://your-domain.com/api/webhooks/eversend
```

### Flutterwave Webhooks

Configure the following webhook URL in your Flutterwave dashboard:
```
https://your-domain.com/api/webhooks/flutterwave
```

Webhooks (optional) - The current implementation verifies payments via API calls on redirect, but webhooks can provide additional security.

## Troubleshooting

### Payment API Returns "Invalid API Key"
- Verify your API key is correct
- Ensure the environment variable name matches exactly (case-sensitive)
- Restart your dev server after adding environment variables

### Payment Modal Shows "Payment Initialization Failed"
- Check browser console for error details
- Verify internet connection
- Ensure API keys are valid and have correct permissions
- Check that Eversend/Flutterwave accounts are active

### Payment Verification Fails
- Transaction IDs must match between enrollment creation and verification
- Check that payment provider response includes correct transaction ID
- Verify payment status in your Eversend/Flutterwave dashboard

## Security Best Practices

1. **Never commit secrets** - Keep API keys in environment variables
2. **Use HTTPS only** - Payment URLs must be served over HTTPS in production
3. **Verify payments server-side** - Always verify payments via API, not just client-side
4. **Store transaction IDs** - Keep records of all transaction IDs for reconciliation
5. **Monitor failed payments** - Set up alerts for failed payment attempts

## Support

For issues with:
- **Eversend**: https://support.eversend.co
- **Flutterwave**: https://support.flutterwave.com
- **This implementation**: Contact your development team

## Currency Support

Current implementation uses **UGX (Ugandan Shilling)**.

To change currency, update the currency parameter in:
- `src/lib/enrollmentService.ts` - Change `'UGX'` to desired currency code
- Supported currencies depend on payment provider

Flutterwave supports multiple currencies; Eversend supports various currencies including UGX, USD, GHS, KES, TZS, and more.
