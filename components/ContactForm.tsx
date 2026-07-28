"use client";

import { useState } from "react";
import { Mail, MapPin, Globe, Send, CheckCircle2, Copy, Check, User, Building } from "lucide-react";

export function ContactForm() {
  const [copied, setCopied] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Quick Contact Cards */}
      <div className="space-y-3">
        {/* Entity & Brand Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3A20BA]/10 flex items-center justify-center text-[#3A20BA] shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Legal Name</p>
              <p className="text-xs font-bold text-gray-900">Pardeep Kumar</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2053BA]/10 flex items-center justify-center text-[#2053BA] shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brand Name</p>
              <p className="text-xs font-bold text-gray-900">Exam Kart</p>
            </div>
          </div>
        </div>

        {/* Email Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#3A20BA]/10 flex items-center justify-center text-[#3A20BA] shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
              <a href="mailto:support@exam-kart.com" className="text-xs font-bold text-gray-900 truncate block hover:text-[#3A20BA]">
                support@exam-kart.com
              </a>
            </div>
          </div>
          <button 
            onClick={() => handleCopy("support@exam-kart.com", "email")}
            className="p-2 rounded-lg text-gray-400 hover:text-[#3A20BA] active:scale-90 transition-transform"
            title="Copy email"
          >
            {copied === "email" ? <Check className="w-4 h-4 text-[#53BA20]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Address Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#2053BA]/10 flex items-center justify-center text-[#2053BA] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Office Address</p>
              <p className="text-xs font-bold text-gray-900 leading-snug">
                282, Sector 4, Hisar Haryana 125001
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleCopy("282, Sector 4, Hisar Haryana 125001", "address")}
            className="p-2 rounded-lg text-gray-400 hover:text-[#2053BA] active:scale-90 transition-transform"
            title="Copy address"
          >
            {copied === "address" ? <Check className="w-4 h-4 text-[#53BA20]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Website Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#8720BA]/10 flex items-center justify-center text-[#8720BA] shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Official Website</p>
              <a 
                href="https://exam-kart.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs font-bold text-gray-900 truncate block hover:text-[#8720BA]"
              >
                https://exam-kart.com/
              </a>
            </div>
          </div>
          <a 
            href="https://exam-kart.com/" 
            target="_blank" 
            rel="noreferrer"
            className="p-2 rounded-lg text-gray-400 hover:text-[#8720BA] active:scale-90 transition-transform text-xs font-bold"
          >
            Visit
          </a>
        </div>
      </div>

      {/* Message Form */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Send Us a Message</h3>
        <p className="text-[11px] text-gray-500 mb-4">Typical response time: Within 24 hours</p>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-[#53BA20]/10 text-[#53BA20] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Message Sent Successfully!</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Thank you for reaching out. Our support team will respond to <strong>{formData.email}</strong> shortly.
            </p>
            <button 
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: "", email: "", subject: "", message: "" });
              }}
              className="text-xs font-bold text-[#3A20BA] underline pt-2 inline-block"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Your Name *</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Email Address *</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Subject</label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="E-Book order issue / Inquiry"
                className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Message *</label>
              <textarea 
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can we assist you today?"
                className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA] focus:bg-white transition-colors resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-[#3A20BA] text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              Submit Inquiry
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
