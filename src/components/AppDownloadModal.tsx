import { useState } from 'react';
import { X, Mail, Check, Loader } from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  appType: 'ios' | 'android';
  onClose: () => void;
}

export default function AppDownloadModal({
  isOpen,
  appType,
  onClose,
}: AppDownloadModalProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);

  const appName = appType === 'ios' ? 'iOS App' : 'Android App';
  const downloadButtonImage = 'https://f003.backblazeb2.com/file/houzing/admin1images/download+button+android+apk.webp';
  const comingSoonText = appType === 'ios' ? 'Soon available on the App Store' : 'Soon available on the Play Store';
  const downloadText = 'You can get direct download on Android with:';

  const handleImageClick = () => {
    setShowEmailForm(true);
    setHideHeader(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      console.log(`Email registered for ${appName} waitlist:`, email);
      setIsSubmitted(true);

      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
        setShowEmailForm(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-md w-full">
        {/* Header */}
        {!hideHeader && (
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h3 className="text-xl font-playfair font-bold text-white">{appName}</h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
        {hideHeader && (
          <div className="flex items-center justify-end p-3 border-b border-slate-700">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-gray-300">
                {comingSoonText}
              </p>
              <Loader className="w-4 h-4 text-rose-500 animate-spin" />
            </div>
            <p className="text-gray-300 mb-4">
              {downloadText}
            </p>

            {/* Download Button Image */}
            <div className="flex justify-center">
              <button
                onClick={handleImageClick}
                className="focus:outline-none"
              >
                <img
                  src={downloadButtonImage}
                  alt={`${appName} Download Button`}
                  className="h-16 cursor-pointer"
                />
              </button>
            </div>

            {/* Email Form */}
            {showEmailForm && (
              <div className="space-y-3 mt-4">
                <div className="bg-slate-700 rounded p-4">
                  <p className="text-sm text-gray-300 mb-3">
                    Be the first to get it when the app is released:
                  </p>

                  {!isSubmitted ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-rose-400"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !email.trim()}
                        className="w-full py-2 bg-rose-600 text-white font-semibold rounded hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Signing up...' : 'Notify Me'}
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400 justify-center py-2">
                      <Check className="w-4 h-4" />
                      <span className="font-semibold">Email saved!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        {!hideHeader && (
          <div className="px-6 py-4 text-xs text-gray-400 text-center border-t border-slate-700">
            We'll notify you when the {appName} is available
          </div>
        )}
      </div>
    </div>
  );
}
