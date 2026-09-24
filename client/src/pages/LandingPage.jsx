import { Link } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import {
  Play,
  Check,
  Zap,
  Target,
  FileText,
  Bot,
  Mic,
  Scissors,
  ImageIcon,
  Search,
  DollarSign,
  BarChart3,
  TrendingUp,
  ChevronDown,
  Eye,
  Clock3,
  UserPlus,
  Wallet,
  TrendingUp as TrendIcon,
  Youtube,
  BarChart2,
  ArrowUpRight,
} from 'lucide-react';
import { useState } from 'react';

const curriculumItems = [
  { icon: Target, title: 'Niche Research', desc: 'Find profitable, low-competition niches' },
  { icon: Search, title: 'Content Research', desc: 'Discover viral content ideas systematically' },
  { icon: FileText, title: 'Scripting', desc: 'Write engaging scripts that keep viewers watching' },
  { icon: Bot, title: 'AI Tools', desc: 'Leverage AI for content creation at scale' },
  { icon: Mic, title: 'Voiceovers', desc: 'Professional voiceovers without hiring talent' },
  { icon: Scissors, title: 'Video Editing', desc: 'Edit like a pro with efficient workflows' },
  { icon: ImageIcon, title: 'Thumbnails', desc: 'Design click-worthy thumbnails that drive CTR' },
  { icon: Zap, title: 'SEO', desc: 'Rank your videos with proven optimization strategies' },
  { icon: DollarSign, title: 'Monetization', desc: 'Multiple revenue streams from your channels' },
  { icon: BarChart3, title: 'Analytics', desc: 'Read data and make informed decisions' },
  { icon: TrendingUp, title: 'Scaling', desc: 'Build a portfolio of automated channels' },
];

const faqs = [
  {
    q: 'What exactly is YouTube Automation?',
    a: 'YouTube Automation is the process of creating and running YouTube channels without showing your face or using your own voice. You outsource or use AI tools for scripting, voiceover, editing, and thumbnail creation.',
  },
  {
    q: 'Do I need prior experience?',
    a: 'No prior experience needed. This course takes you from complete beginner to running your own automated channels. We cover everything step by step.',
  },
  {
    q: 'How long do I have access?',
    a: 'You get lifetime access to the course content, including all future updates. Your access is tied to your account and never expires.',
  },
  {
    q: 'What is the refund policy?',
    a: 'We offer a 7-day refund guarantee. If you complete the first 3 modules and feel the course is not for you, contact us for a full refund.',
  },
  {
    q: 'Is this a one-time payment?',
    a: 'Yes! ₦15,000 one-time payment. No monthly fees, no hidden charges. Pay once, learn forever.',
  },
];

// Phone Mockup Component (reused for both mobile & desktop)
const PhoneMockup = ({ className = '' }) => (
  <div className={`relative w-[320px] h-[640px] bg-dark-900 rounded-[3rem] border-[6px] border-dark-700 shadow-2xl overflow-hidden ${className}`}>
    {/* Notch */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-dark-950 rounded-b-2xl z-10" />

    {/* Status bar */}
    <div className="flex justify-between items-center px-6 pt-3 pb-1 text-white text-xs">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className="w-4 h-2.5 border border-white rounded-sm relative">
          <div className="absolute inset-0.5 bg-white rounded-sm" style={{ width: '80%' }} />
        </div>
      </div>
    </div>

    {/* App Header */}
    <div className="flex items-center gap-2 px-5 py-3 border-b border-dark-800">
      <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
        <Youtube className="w-4 h-4 text-white" />
      </div>
      <span className="text-white font-semibold text-sm">YouTubeAuto</span>
    </div>

    {/* Analytics Content */}
    <div className="p-4 space-y-4">
      {/* Header with growth badge */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">Channel Analytics</p>
          <p className="text-dark-500 text-xs">Last 28 days</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <TrendIcon className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400 text-[10px] font-medium">+24.3%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-dark-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-dark-500 text-[10px] mb-1">
            <Eye className="w-3 h-3" />
            Views
          </div>
          <p className="text-white text-lg font-bold">1.2M</p>
          <p className="text-emerald-400 text-[10px]">+18% last month</p>
        </div>
        <div className="bg-dark-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-dark-500 text-[10px] mb-1">
            <Clock3 className="w-3 h-3" />
            Watch Time
          </div>
          <p className="text-white text-lg font-bold">89.4K hrs</p>
          <p className="text-emerald-400 text-[10px]">+62% last month</p>
        </div>
        <div className="bg-dark-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-dark-500 text-[10px] mb-1">
            <UserPlus className="w-3 h-3" />
            Subscribers
          </div>
          <p className="text-white text-lg font-bold">48.2K</p>
          <p className="text-emerald-400 text-[10px]">+72% last month</p>
        </div>
        <div className="bg-dark-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-dark-500 text-[10px] mb-1">
            <Wallet className="w-3 h-3" />
            Revenue
          </div>
          <p className="text-white text-lg font-bold">$4,280</p>
          <p className="text-emerald-400 text-[10px]">+78% last month</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-dark-800/30 rounded-lg p-3">
        <div className="flex items-end justify-between h-20 gap-1">
          {[30, 45, 38, 52, 42, 58, 50, 65, 60, 72, 68, 85].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-red-600/60 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-dark-600 text-[8px]">
          <span>Mar 1</span>
          <span>Mar 7</span>
          <span>Mar 21</span>
          <span>Mar 28</span>
        </div>
      </div>

      {/* Top Videos */}
      <div>
        <p className="text-dark-500 text-[10px] font-medium uppercase tracking-wider mb-2">Top Performing Videos</p>
        <div className="space-y-2">
          {[
            { title: 'I Tried $1,000/Month Faceless Channel', views: '532K views · 4 days ago' },
            { title: 'How to Grow on YouTube Without Showing Your Face', views: '421K views · 1 week ago' },
          ].map((video, i) => (
            <div key={i} className="flex items-center gap-2 bg-dark-800/30 rounded-lg p-2">
              <div className="w-10 h-7 bg-dark-800 rounded flex items-center justify-center flex-shrink-0">
                <Play className="w-3 h-3 text-dark-500 fill-dark-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[11px] truncate">{video.title}</p>
                <p className="text-dark-500 text-[9px]">{video.views}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-dark-500 -rotate-90" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [openFaq, setOpenFaq] = useState(null);
  const [couponCode, setCouponCode] = useState('');

  return (
    <div className="bg-dark-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-dark-950" />

        {/* Mobile: Phone as background */}
        <div className="absolute inset-0 lg:hidden flex items-center justify-center opacity-20 pointer-events-none">
          <PhoneMockup className="scale-90 translate-y-10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-28 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
                Build YouTube<br />
                Channels<br />
                That Run<br />
                Themselves
              </h1>
              <p className="text-lg text-dark-400 leading-relaxed mb-10 max-w-md">
                The complete system for faceless YouTube automation. From niche
                selection to monetization — everything you need, taught step by step.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    Join the Course — ₦15,000
                  </Link>
                )}
                <a
                  href="#curriculum"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-dark-700 hover:border-dark-600 text-dark-300 hover:text-white font-semibold rounded-xl transition-all"
                >
                  View Curriculum
                </a>
              </div>
            </div>

            {/* Right: Phone Mockup — Desktop Only */}
            <div className="relative hidden lg:flex justify-center items-center">
              {/* Floating icons around phone */}
              <div className="absolute top-8 left-4 w-14 h-14 bg-dark-800/80 backdrop-blur border border-dark-700 rounded-2xl flex items-center justify-center shadow-xl rotate-[-10deg]">
                <ArrowUpRight className="w-6 h-6 text-red-500" />
              </div>
              <div className="absolute top-1/3 -right-4 w-14 h-14 bg-dark-800/80 backdrop-blur border border-dark-700 rounded-2xl flex items-center justify-center shadow-xl rotate-[10deg]">
                <BarChart2 className="w-6 h-6 text-red-500" />
              </div>
              <div className="absolute bottom-16 left-0 w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl rotate-[-5deg]">
                <Youtube className="w-7 h-7 text-white" />
              </div>

              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section id="curriculum" className="py-24 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What You'll <span className="text-red-500">Learn</span>
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              A comprehensive curriculum covering every aspect of building automated YouTube channels
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculumItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="group p-6 bg-dark-900 border border-dark-800 rounded-xl hover:border-red-600/30 transition-all card-hover"
                >
                  <div className="w-12 h-12 bg-red-600/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-600/20 transition-colors">
                    <Icon className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-dark-400 text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community & Accountability */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Community + <span className="text-red-500">Accountability</span>
              </h2>
              <p className="text-dark-400 leading-relaxed mb-8">
                You're not learning alone. Join a community of driven creators, ask questions,
                share wins, and stay accountable with our built-in progress tracking system.
              </p>
              <ul className="space-y-4">
                {[
                  'Private community forum with categorized discussions',
                  'Weekly accountability check-ins',
                  'Direct access to instructors for Q&A',
                  'Peer feedback on assignments and channel reviews',
                  'Ever-growing knowledge base from past questions',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-dark-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div>
                    <p className="text-white font-medium">Akhi completed Lesson 7</p>
                    <p className="text-dark-500 text-sm">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div>
                    <p className="text-white font-medium">Sarah submitted her assignment</p>
                    <p className="text-dark-500 text-sm">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <p className="text-white font-medium">Mike asked a question in Editing</p>
                    <p className="text-dark-500 text-sm">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-dark-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Simple, <span className="text-red-500">One-Time Pricing</span>
          </h2>
          <p className="text-dark-400 mb-12">Pay once. Learn forever. No hidden fees.</p>

          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
            <div className="mb-8">
              <p className="text-dark-400 text-sm mb-2">Full Course Access</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-white">₦15,000</span>
              </div>
              <p className="text-dark-500 text-sm mt-2">One-time payment</p>
            </div>

            <ul className="space-y-3 text-left mb-8">
              {[
                '30+ video lessons',
                'Downloadable resources & templates',
                'Private community access',
                'Assignment feedback',
                'Lifetime updates',
                'Certificate of completion',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-dark-300">
                  <Check className="w-5 h-5 text-red-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Coupon */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Have a coupon?"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:border-red-500 transition-colors"
                />
                <button className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg text-sm font-medium transition-colors">
                  Apply
                </button>
              </div>
            </div>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="block w-full py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="block w-full py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02]"
              >
                Join the Course
              </Link>
            )}

            <p className="mt-4 text-dark-500 text-xs">
              7-day refund guarantee. See terms for details.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
            Frequently Asked <span className="text-red-500">Questions</span>
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-white font-medium">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-dark-400 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-dark-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}