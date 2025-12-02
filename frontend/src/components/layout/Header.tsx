'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnect from '@/components/WalletConnect';
import NotificationCenter from '@/components/ui/NotificationCenter';
import { EducationalToggle, EducationalBadge } from '@/components/educational';
import { SimulationBadge } from '@/components/sandbox';
import ClientOnly from '@/components/ClientOnly';

// Modern DeFi Logo Component - Clean and Professional
function Logo() {
  return (
    <div className="w-9 h-9 relative flex items-center justify-center">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {/* Background rounded square */}
        <rect x="2" y="2" width="32" height="32" rx="8" fill="url(#logoGradient)" />
        {/* LB letters stylized */}
        <text x="18" y="24" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui">
          LB
        </text>
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
              <NavLink href="/liquidator" icon="🤖">
                Liquidator
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
          <NavLink href="/liquidator" icon="🤖">Liquidator</NavLink>
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
