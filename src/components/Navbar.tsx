import { Link } from 'react-router-dom';
import { Car, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Car className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">VF5 Rent</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Thuê Xe
            </Link>
            <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              <ShieldCheck className="h-4 w-4" />
              Quản trị
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
