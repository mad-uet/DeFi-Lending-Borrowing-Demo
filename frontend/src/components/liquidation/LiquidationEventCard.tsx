'use client';

import { LiquidationEvent } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface LiquidationEventCardProps {
  event: LiquidationEvent;
  isCompact?: boolean;
}

export function LiquidationEventCard({ event, isCompact = false }: LiquidationEventCardProps) {
  const timeAgo = formatDistanceToNow(event.timestamp, { addSuffix: true });
  
  // Truncate address for display
  const truncateAddress = (address: string) => 
    `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  if (isCompact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-xl">💰</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {parseFloat(event.debtAmount).toFixed(4)} {event.debtTokenSymbol} → {parseFloat(event.collateralSeized).toFixed(4)} {event.collateralTokenSymbol}
            </p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-green-400">+${event.liquidationBonusUSD}</p>
          <p className="text-xs text-gray-500">profit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <div>
              <h3 className="text-lg font-bold text-white">Liquidation Executed</h3>
              <p className="text-xs text-gray-400">{timeAgo}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-400">+${event.liquidationBonusUSD}</p>
            <p className="text-xs text-green-300/80">Profit Earned</p>
          </div>
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          {/* Debt Repaid */}
          <div className="flex-1 bg-red-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-red-300 mb-1">Debt Repaid</p>
            <p className="text-lg font-bold text-white">
              {parseFloat(event.debtAmount).toFixed(4)}
            </p>
            <p className="text-sm text-gray-400">{event.debtTokenSymbol}</p>
            <p className="text-xs text-gray-500">${event.debtAmountUSD}</p>
          </div>
          
          {/* Arrow */}
          <div className="flex flex-col items-center">
            <span className="text-2xl">→</span>
            <span className="text-xs text-gray-500">+5%</span>
          </div>
          
          {/* Collateral Received */}
          <div className="flex-1 bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-green-300 mb-1">Collateral Seized</p>
            <p className="text-lg font-bold text-white">
              {parseFloat(event.collateralSeized).toFixed(4)}
            </p>
            <p className="text-sm text-gray-400">{event.collateralTokenSymbol}</p>
            <p className="text-xs text-gray-500">${event.collateralSeizedUSD}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-900/50 rounded-lg p-2">
            <p className="text-xs text-gray-500 mb-1">Borrower</p>
            <p className="text-gray-300 font-mono text-xs">{truncateAddress(event.borrower)}</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2">
            <p className="text-xs text-gray-500 mb-1">Liquidator</p>
            <p className="text-gray-300 font-mono text-xs">{truncateAddress(event.liquidator)}</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2">
            <p className="text-xs text-gray-500 mb-1">Health Factor Before</p>
            <p className="text-red-400 font-medium">{parseFloat(event.healthFactorBefore).toFixed(4)}</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2">
            <p className="text-xs text-gray-500 mb-1">Health Factor After</p>
            <p className="text-green-400 font-medium">{parseFloat(event.healthFactorAfter).toFixed(4)}</p>
          </div>
        </div>

        {/* Transaction Link */}
        {event.transactionHash && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <a 
              href={`https://etherscan.io/tx/${event.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View Transaction</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Component to show the liquidation profit breakdown
interface LiquidationProfitBreakdownProps {
  debtAmountUSD: string;
  collateralSeizedUSD: string;
  bonusUSD: string;
  bonusPercent?: number;
}

export function LiquidationProfitBreakdown({ 
  debtAmountUSD, 
  collateralSeizedUSD, 
  bonusUSD,
  bonusPercent = 5
}: LiquidationProfitBreakdownProps) {
  return (
    <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-lg p-4 border border-gray-700">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">Profit Breakdown</h4>
      
      <div className="space-y-2">
        {/* Debt Paid */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Debt Repaid</span>
          <span className="text-sm text-red-400 font-mono">-${debtAmountUSD}</span>
        </div>
        
        {/* Collateral Received */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Collateral Value</span>
          <span className="text-sm text-green-400 font-mono">+${collateralSeizedUSD}</span>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-700 my-2"></div>
        
        {/* Net Profit */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300 font-medium">
            Net Profit ({bonusPercent}% Bonus)
          </span>
          <span className="text-lg text-green-400 font-bold font-mono">
            +${bonusUSD}
          </span>
        </div>
      </div>
    </div>
  );
}

// List of recent liquidations
interface LiquidationHistoryListProps {
  events: LiquidationEvent[];
  maxItems?: number;
  showEmpty?: boolean;
}

export function LiquidationHistoryList({ 
  events, 
  maxItems = 5,
  showEmpty = true 
}: LiquidationHistoryListProps) {
  const displayEvents = events.slice(0, maxItems);

  if (events.length === 0 && showEmpty) {
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-3xl mb-2 block">📭</span>
        <p className="text-sm">No liquidations executed yet</p>
        <p className="text-xs text-gray-600 mt-1">
          Liquidations occur when positions become undercollateralized
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayEvents.map((event) => (
        <LiquidationEventCard key={event.id} event={event} isCompact />
      ))}
      
      {events.length > maxItems && (
        <p className="text-xs text-center text-gray-500 pt-2">
          +{events.length - maxItems} more liquidations
        </p>
      )}
    </div>
  );
}
