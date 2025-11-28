'use client';

import { useState } from 'react';
import { useDiagnostics, DiagnosticStatus, DiagnosticCategory, LogEntry } from '@/hooks/useDiagnostics';
import { Header } from '@/components/layout';
import { ADDRESSES, CHAIN_ID } from '@/lib/contracts';

const StatusIcon = ({ status }: { status: DiagnosticStatus }) => {
  switch (status) {
    case 'success':
      return (
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'error':
      return (
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    case 'warning':
      return (
        <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    case 'pending':
      return (
        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center animate-pulse">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
        </div>
      );
  }
};

const CategoryCard = ({ category }: { category: DiagnosticCategory }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const statusColors = {
    success: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    error: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    pending: 'border-gray-300 bg-gray-50 dark:bg-gray-800',
    skipped: 'border-gray-300 bg-gray-50 dark:bg-gray-800',
  };

  return (
    <div className={`rounded-xl border-2 ${statusColors[category.status]} overflow-hidden`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <StatusIcon status={category.status} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</h3>
          <span className="text-sm text-gray-500">
            ({category.results.filter((r) => r.status === 'success').length}/{category.results.length} passed)
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-6 pb-4 space-y-3">
          {category.results.map((result, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
            >
              <StatusIcon status={result.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">{result.name}</h4>
                  <span className="text-xs text-gray-400">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{result.message}</p>
                {result.details && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono break-all">
                    {result.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LogConsole = ({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) => {
  const [filter, setFilter] = useState<LogEntry['type'] | 'ALL'>('ALL');

  const filteredLogs = filter === 'ALL' ? logs : logs.filter((log) => log.type === filter);

  const typeColors = {
    INFO: 'text-blue-600 dark:text-blue-400',
    SUCCESS: 'text-green-600 dark:text-green-400',
    ERROR: 'text-red-600 dark:text-red-400',
    WARNING: 'text-yellow-600 dark:text-yellow-400',
  };

  const exportLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h3 className="text-white font-semibold">Debug Console</h3>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogEntry['type'] | 'ALL')}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
          >
            <option value="ALL">All</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
          </select>
          <button
            onClick={exportLogs}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Export
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="h-64 overflow-y-auto p-4 font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500">No logs yet...</p>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-2 py-1">
              <span className="text-gray-500 text-xs">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className={`font-bold ${typeColors[log.type]}`}>[{log.type}]</span>
              <span className="text-gray-300">{log.message}</span>
              {log.details && (
                <span className="text-gray-500 text-xs">{log.details}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ConfigDisplay = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const configItems = [
    { label: 'Chain ID', value: CHAIN_ID.toString() },
    { label: 'RPC URL', value: 'http://127.0.0.1:8545' },
    { label: 'LendingPool', value: ADDRESSES.LendingPool },
    { label: 'LARToken', value: ADDRESSES.LARToken },
    { label: 'InterestRateModel', value: ADDRESSES.InterestRateModel },
    { label: 'PriceOracle', value: ADDRESSES.PriceOracle },
    { label: 'WETH', value: ADDRESSES.WETH },
    { label: 'DAI', value: ADDRESSES.DAI },
    { label: 'USDC', value: ADDRESSES.USDC },
    { label: 'LINK', value: ADDRESSES.LINK },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Environment Configuration
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Current values from .env.local
        </p>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {configItems.map((item) => (
          <div
            key={item.label}
            className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-gray-800 dark:text-gray-200 max-w-[300px] truncate">
                {item.value || 'Not set'}
              </code>
              {item.value && (
                <button
                  onClick={() => copyToClipboard(item.value)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function StatusPage() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { isRunning, lastRun, categories, logs, runDiagnostics, clearLogs } = useDiagnostics(
    autoRefresh ? 10000 : undefined
  );

  const overallStatus: DiagnosticStatus = categories.some((c) => c.status === 'error')
    ? 'error'
    : categories.some((c) => c.status === 'warning')
    ? 'warning'
    : categories.length > 0
    ? 'success'
    : 'pending';

  const statusMessages = {
    success: 'All systems operational',
    error: 'Issues detected - see details below',
    warning: 'Some warnings detected',
    pending: 'Running diagnostics...',
    skipped: 'Diagnostics not run',
  };

  const statusColors = {
    success: 'from-green-500 to-emerald-600',
    error: 'from-red-500 to-rose-600',
    warning: 'from-amber-500 to-orange-600',
    pending: 'from-gray-400 to-gray-500',
    skipped: 'from-gray-400 to-gray-500',
  };

  const statusIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    pending: '⏳',
    skipped: '⏸️',
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Overall Status Banner */}
        <div
          className={`bg-gradient-to-r ${statusColors[overallStatus]} rounded-2xl p-6 mb-8 text-white shadow-xl animate-fade-in`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">{statusIcons[overallStatus]}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{statusMessages[overallStatus]}</h2>
                <p className="text-white/80">
                  {lastRun
                    ? `Last checked: ${lastRun.toLocaleTimeString()}`
                    : 'Running initial diagnostics...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-colors">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded accent-white"
                />
                <span className="text-sm font-medium">Auto-refresh</span>
              </label>
              <button
                onClick={runDiagnostics}
                disabled={isRunning}
                className="px-6 py-2.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-xl font-semibold transition-all flex items-center gap-2 backdrop-blur-sm"
              >
                {isRunning && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                {isRunning ? 'Running...' : '🔍 Run Diagnostics'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Diagnostic Results */}
          <div className="lg:col-span-2 space-y-6">
            {categories.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Running diagnostics...</p>
              </div>
            ) : (
              categories.map((category, index) => (
                <CategoryCard key={index} category={category} />
              ))
            )}
          </div>

          {/* Right Column - Config & Logs */}
          <div className="space-y-6">
            <ConfigDisplay />
            
            {/* Quick Fixes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Fixes
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Hardhat Node Not Running?</p>
                  <code className="text-xs bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded mt-2 block">
                    npx hardhat node
                  </code>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Wrong Chain ID?</p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                    In MetaMask: Settings → Networks → Add Hardhat (Chain ID: 31337, RPC: http://127.0.0.1:8545)
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="font-medium text-red-800 dark:text-red-200">Contracts Not Deployed?</p>
                  <code className="text-xs bg-red-100 dark:bg-red-800 px-2 py-1 rounded mt-2 block">
                    npx hardhat run scripts/deploy-core.ts --network localhost
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Console */}
        <div className="mt-8">
          <LogConsole logs={logs} onClear={clearLogs} />
        </div>
      </div>
    </main>
  );
}
