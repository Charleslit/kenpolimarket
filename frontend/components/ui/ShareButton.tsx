'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
}

export default function ShareButton({ 
  title = "BlockcertAfrica Forecast",
  text = "Check out this election forecast on BlockcertAfrica",
  url
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('✅ Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('❌ Failed to copy link');
    }
  };

  const shareViaTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`;
    window.location.href = emailUrl;
  };

  const shareNative = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Native share failed:', error);
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
        aria-label="Share"
        aria-expanded={isOpen}
      >
        <span>🔗</span>
        <span>Share</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={copyToClipboard}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>{copied ? '✅' : '📋'}</span>
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {hasNativeShare && (
              <button
                onClick={shareNative}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <span>📱</span>
                <span>Share via...</span>
              </button>
            )}

            <button
              onClick={shareViaTwitter}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>🐦</span>
              <span>Share on Twitter</span>
            </button>

            <button
              onClick={shareViaWhatsApp}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>💬</span>
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={shareViaEmail}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>📧</span>
              <span>Share via Email</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

