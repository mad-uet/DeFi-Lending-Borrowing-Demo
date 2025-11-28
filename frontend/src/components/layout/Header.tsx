'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnect from '@/components/WalletConnect';
import NotificationCenter from '@/components/ui/NotificationCenter';
import { EducationalToggle, EducationalBadge } from '@/components/educational';
import { SimulationBadge } from '@/components/sandbox';
import ClientOnly from '@/components/ClientOnly';

// SVG Logo Component - Modern DeFi-style icon
function Logo() {
  return (
    <div className="w-10 h-10 relative">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="innerGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        
        {/* Outer ring */}
        <circle cx="20" cy="20" r="18" stroke="url(#logoGradient)" strokeWidth="2.5" fill="none" />
        
        {/* Inner stylized L shape representing Lending */}
        <path 
          d="M14 12 L14 24 L26 24" 
          stroke="url(#logoGradient)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Ascending arrow representing growth/borrowing */}
        <path 
          d="M22 20 L26 16 M26 16 L22 16 M26 16 L26 20" 
          stroke="url(#innerGradient)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Small decorative dots */}
        <circle cx="14" cy="12" r="2" fill="url(#logoGradient)" />
        <circle cx="26" cy="16" r="2" fill="url(#innerGradient)" />
      </svg>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: string;
}

function NavLink({ href, children, icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
        isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </Link>
  );
}

interface HeaderProps {
  showEducationalControls?: boolean;
  showSimulationBadge?: boolean;
  showNotifications?: boolean;
  showWallet?: boolean;
}

export default function Header({
  showEducationalControls = true,
  showSimulationBadge = true,
  showNotifications = true,
  showWallet = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-md border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <Logo />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  DeFi LeBo
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Lending & Borrowing
                </p>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/" icon="📊">
                Dashboard
              </NavLink>
              <NavLink href="/analytics" icon="📈">
                Analytics
              </NavLink>
              <NavLink href="/status" icon="🔧">
                Status
              </NavLink>
            </nav>
          </div>
          
          {/* Right side controls */}
          <ClientOnly>
            <div className="flex items-center gap-2 sm:gap-3">
              {showSimulationBadge && <SimulationBadge />}
              {showEducationalControls && (
                <>
                  <EducationalBadge />
                  <div className="hidden sm:block">
                    <EducationalToggle size="sm" />
                  </div>
                </>
              )}
              {showNotifications && (
                <div className="relative">
                  <NotificationCenter />
                </div>
              )}
              {showWallet && <WalletConnect />}
            </div>
          </ClientOnly>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <nav className="flex items-center justify-around">
          <NavLink href="/" icon="📊">Dashboard</NavLink>
          <NavLink href="/analytics" icon="📈">Analytics</NavLink>
          <NavLink href="/status" icon="🔧">Status</NavLink>
        </nav>
      </div>
    </header>
  );
}

// Compact header for modals/overlays that need a simpler header
export function CompactHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-bold text-gray-900 dark:text-white">DeFi LeBo</span>
          </Link>
          <ClientOnly>
            <WalletConnect />
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}
