import React from 'react';
import { Search, MessageCircle, BookOpen, Shield, AlertTriangle, HelpCircle, Mail, ExternalLink } from 'lucide-react';

export default function HelpCenter() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-playfair font-bold text-white mb-2">Help Center</h1>
          <p className="text-gray-300">Find answers, troubleshoot issues, and get support.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search help articles, topics, or FAQs..."
              className="w-full pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
            />
          </div>
          <a
            href="mailto:info@flourishtalents.com"
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" /> Contact Support
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="glass-effect p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-6 h-6 text-rose-400" />
                <h2 className="text-xl font-semibold text-white">Popular FAQs</h2>
              </div>
              <div className="divide-y divide-white/10">
                <details className="py-3 group">
                  <summary className="cursor-pointer text-white font-medium flex items-center justify-between">
                    How do I enroll in a masterclass?
                  </summary>
                  <p className="text-gray-300 mt-2">Open the Masterclass page, choose a course, and click Enroll Now. You may need a paid membership tier for some courses.</p>
                </details>
                <details className="py-3 group">
                  <summary className="cursor-pointer text-white font-medium">Why can't I access a course?</summary>
                  <p className="text-gray-300 mt-2">Access depends on your membership tier and enrollment status. Upgrade from your Account page or enroll directly from the course card.</p>
                </details>
                <details className="py-3 group">
                  <summary className="cursor-pointer text-white font-medium">How do I report a technical issue?</summary>
                  <p className="text-gray-300 mt-2">Use the Contact Support button above or email support@flourishtalents.com with screenshots, the page URL, and a short description.</p>
                </details>
              </div>
            </div>

            <div className="glass-effect p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Getting Started</h2>
              </div>
              <ol className="list-decimal list-inside text-gray-300 space-y-2">
                <li>Create your account and choose a membership tier.</li>
                <li>Browse Masterclass courses and filter by category.</li>
                <li>Enroll, then access your content from the Learning tab.</li>
                <li>Track progress and earn certificates upon completion.</li>
              </ol>
            </div>

            <div className="glass-effect p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Account & Billing</h2>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li>Update profile and membership from the Account page.</li>
                <li>Billing is processed securely; receipts are sent via email.</li>
                <li>Cancel or change plans anytime; changes apply to the next cycle.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-effect p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Technical Issues</h2>
              </div>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>Refresh the page and try again.</li>
                <li>Clear browser cache or try a different browser.</li>
                <li>Ensure a stable internet connection for video playback.</li>
              </ul>
            </div>

            <div className="glass-effect p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-6 h-6 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Community & Feedback</h2>
              </div>
              <p className="text-gray-300 text-sm mb-3">Share feedback or feature requests to help us improve.</p>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200"
              >
                Submit feedback <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
