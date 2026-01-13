import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function useReferralCode() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Generate referral code from user ID and a timestamp
      // Format: REF-PREFIX-USERID
      const userIdShort = user.id.substring(0, 8).toUpperCase();
      const code = `REF-TT${new Date().getFullYear()}-${userIdShort}`;
      setReferralCode(code);
    } catch (err) {
      console.error('Error generating referral code:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  };

  return { referralCode, loading, copyToClipboard };
}
