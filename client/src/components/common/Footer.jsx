import { Link } from 'react-router-dom';
import { Play, Youtube, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold text-white">
                U<span className="text-primary-500">Creator</span>
              </span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed">
              Master YouTube automation from start to finish. Build, scale, and monetize faceless channels.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Course</h4>
            <ul className="space-y-2">
              <li><a href="#curriculum" className="text-dark-400 hover:text-primary-400 text-sm transition-colors">Curriculum</a></li>
              <li><Link to="/community" className="text-dark-400 hover:text-primary-400 text-sm transition-colors">Community</Link></li>
              <li><a href="#pricing" className="text-dark-400 hover:text-primary-400 text-sm transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#faq" className="text-dark-400 hover:text-primary-400 text-sm transition-colors">FAQ</a></li>
              <li><span className="text-dark-400 text-sm">Refund Policy</span></li>
              <li><span className="text-dark-400 text-sm">Terms of Service</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-dark-800 text-center">
          <p className="text-dark-500 text-sm">
            © {new Date().getFullYear()} YouTube Automation Course. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}