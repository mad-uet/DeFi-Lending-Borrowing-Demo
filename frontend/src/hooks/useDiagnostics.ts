'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserProvider, JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { ADDRESSES, LENDING_POOL_ABI, ERC20_ABI, LAR_TOKEN_ABI, PRICE_ORACLE_ABI, CHAIN_ID } from '@/lib/contracts';

export type DiagnosticStatus = 'pending' | 'success' | 'error' | 'warning' | 'skipped';

export interface DiagnosticResult {
  name: string;
  status: DiagnosticStatus;
  message: string;
  details?: string;
  data?: any;
  timestamp: Date;
}

export interface DiagnosticCategory {
  name: string;
  status: DiagnosticStatus;
  results: DiagnosticResult[];
}

export interface DiagnosticsState {
  isRunning: boolean;
  lastRun: Date | null;
  categories: DiagnosticCategory[];
  logs: LogEntry[];
}

export interface LogEntry {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  details?: string;
  timestamp: Date;
}

const RPC_URL = 'http://127.0.0.1:8545';

export function useDiagnostics(autoRetryInterval?: number) {
  const [state, setState] = useState<DiagnosticsState>({
    isRunning: false,
    lastRun: null,
    categories: [],
    logs: [],
  });

  const logIdCounter = useRef(0);

  const addLog = useCallback((type: LogEntry['type'], message: string, details?: string) => {
    const entry: LogEntry = {
      id: `log-${++logIdCounter.current}`,
      type,
      message,
      details,
      timestamp: new Date(),
    };
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs.slice(-99), entry], // Keep last 100 logs
    }));
  }, []);

  const clearLogs = useCallback(() => {
    setState((prev) => ({ ...prev, logs: [] }));
  }, []);

  const runDiagnostics = useCallback(async () => {
    setState((prev) => ({ ...prev, isRunning: true, categories: [] }));
    addLog('INFO', 'Starting diagnostic checks...');

    const categories: DiagnosticCategory[] = [];

    // ============ CATEGORY 1: MetaMask / Browser Wallet ============
    const metamaskResults: DiagnosticResult[] = [];
    addLog('INFO', 'Checking MetaMask availability...');

    // Check if window.ethereum exists
    const hasEthereum = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    metamaskResults.push({
      name: 'MetaMask Installed',
      status: hasEthereum ? 'success' : 'error',
      message: hasEthereum ? 'MetaMask (or compatible wallet) detected' : 'No Web3 wallet detected',
      details: hasEthereum ? `Provider: ${window.ethereum.isMetaMask ? 'MetaMask' : 'Other'}` : 'Please install MetaMask',
      timestamp: new Date(),
    });

    if (hasEthereum) {
      addLog('SUCCESS', 'MetaMask detected');

      // Check if connected
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const isConnected = accounts && accounts.length > 0;
        metamaskResults.push({
          name: 'Wallet Connected',
          status: isConnected ? 'success' : 'warning',
          message: isConnected ? `Connected: ${accounts[0]}` : 'Wallet not connected',
          details: isConnected ? `Account: ${accounts[0]}` : 'Click "Connect Wallet" on main page',
          data: { accounts },
          timestamp: new Date(),
        });
        addLog(isConnected ? 'SUCCESS' : 'WARNING', isConnected ? `Connected to ${accounts[0].slice(0, 10)}...` : 'Wallet not connected');
      } catch (err: any) {
        metamaskResults.push({
          name: 'Wallet Connected',
          status: 'error',
          message: 'Failed to check wallet connection',
          details: err.message,
          timestamp: new Date(),
        });
        addLog('ERROR', 'Failed to check wallet connection', err.message);
      }

      // Check chain ID
      try {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        const expectedChainId = CHAIN_ID;
        const chainMatch = chainId === expectedChainId;
        metamaskResults.push({
          name: 'Network Chain ID',
          status: chainMatch ? 'success' : 'error',
          message: chainMatch ? `Chain ID: ${chainId} (Correct)` : `Chain ID mismatch: ${chainId} vs expected ${expectedChainId}`,
          details: chainMatch ? 'Connected to Hardhat Local network' : 'Switch to Hardhat Local network (Chain ID 31337)',
          data: { chainId, expected: expectedChainId },
          timestamp: new Date(),
        });
        addLog(chainMatch ? 'SUCCESS' : 'ERROR', `Chain ID: ${chainId}`, chainMatch ? 'Matches expected' : `Expected: ${expectedChainId}`);
      } catch (err: any) {
        metamaskResults.push({
          name: 'Network Chain ID',
          status: 'error',
          message: 'Failed to get chain ID',
          details: err.message,
          timestamp: new Date(),
        });
        addLog('ERROR', 'Failed to get chain ID', err.message);
      }
    } else {
      addLog('ERROR', 'MetaMask not detected');
    }

    categories.push({
      name: 'MetaMask / Wallet',
      status: metamaskResults.some((r) => r.status === 'error')
        ? 'error'
        : metamaskResults.some((r) => r.status === 'warning')
        ? 'warning'
        : 'success',
      results: metamaskResults,
    });

    // ============ CATEGORY 2: RPC / Hardhat Node ============
    const rpcResults: DiagnosticResult[] = [];
    addLog('INFO', `Checking RPC connection to ${RPC_URL}...`);

    let rpcProvider: JsonRpcProvider | null = null;
    try {
      rpcProvider = new JsonRpcProvider(RPC_URL);
      const network = await rpcProvider.getNetwork();
      rpcResults.push({
        name: 'RPC Connection',
        status: 'success',
        message: 'Connected to Hardhat node',
        details: `Chain ID: ${network.chainId}, Network: ${network.name}`,
        data: { chainId: Number(network.chainId), name: network.name },
        timestamp: new Date(),
      });
      addLog('SUCCESS', 'RPC connection successful', `Chain ID: ${network.chainId}`);

      // Check block number
      const blockNumber = await rpcProvider.getBlockNumber();
      rpcResults.push({
        name: 'Block Number',
        status: 'success',
        message: `Current block: ${blockNumber}`,
        details: blockNumber > 0 ? 'Blockchain is active' : 'No blocks mined yet',
        data: { blockNumber },
        timestamp: new Date(),
      });
      addLog('SUCCESS', `Current block: ${blockNumber}`);
    } catch (err: any) {
      rpcResults.push({
        name: 'RPC Connection',
        status: 'error',
        message: 'Failed to connect to Hardhat node',
        details: `${err.message}. Is the Hardhat node running? Run: npx hardhat node`,
        timestamp: new Date(),
      });
      addLog('ERROR', 'RPC connection failed', err.message);
    }

    categories.push({
      name: 'RPC / Hardhat Node',
      status: rpcResults.some((r) => r.status === 'error') ? 'error' : 'success',
      results: rpcResults,
    });

    // ============ CATEGORY 3: Environment Configuration ============
    const envResults: DiagnosticResult[] = [];
    addLog('INFO', 'Checking environment configuration...');

    const envVars = {
      LENDING_POOL: ADDRESSES.LendingPool,
      LAR_TOKEN: ADDRESSES.LARToken,
      INTEREST_RATE_MODEL: ADDRESSES.InterestRateModel,
      PRICE_ORACLE: ADDRESSES.PriceOracle,
      WETH: ADDRESSES.WETH,
      DAI: ADDRESSES.DAI,
      USDC: ADDRESSES.USDC,
      LINK: ADDRESSES.LINK,
    };

    for (const [name, address] of Object.entries(envVars)) {
      const isSet = address && address.length > 0 && address !== '0x';
      const isValidFormat = /^0x[a-fA-F0-9]{40}$/.test(address);
      envResults.push({
        name: `${name} Address`,
        status: isSet && isValidFormat ? 'success' : isSet ? 'warning' : 'error',
        message: isSet ? address : 'Not configured',
        details: !isSet
          ? `Set NEXT_PUBLIC_${name}_ADDRESS in .env.local`
          : !isValidFormat
          ? 'Invalid address format'
          : 'Address configured',
        data: { address },
        timestamp: new Date(),
      });
    }

    // Check chain ID config
    envResults.push({
      name: 'Chain ID Config',
      status: CHAIN_ID === 31337 ? 'success' : 'warning',
      message: `Configured: ${CHAIN_ID}`,
      details: CHAIN_ID === 31337 ? 'Correct for Hardhat' : 'Expected 31337 for Hardhat local',
      data: { chainId: CHAIN_ID },
      timestamp: new Date(),
    });

    addLog('INFO', `Environment: ${Object.values(envVars).filter((v) => v).length}/${Object.keys(envVars).length} addresses configured`);

    categories.push({
      name: 'Environment Configuration',
      status: envResults.some((r) => r.status === 'error')
        ? 'error'
        : envResults.some((r) => r.status === 'warning')
        ? 'warning'
        : 'success',
      results: envResults,
    });

    // ============ CATEGORY 4: Smart Contract Verification ============
    const contractResults: DiagnosticResult[] = [];
    addLog('INFO', 'Verifying smart contract deployments...');

    if (rpcProvider) {
      // Check LendingPool
      if (ADDRESSES.LendingPool) {
        try {
          const code = await rpcProvider.getCode(ADDRESSES.LendingPool);
          const hasCode = code !== '0x' && code.length > 2;
          
          if (hasCode) {
            // Try to call getSupportedTokensCount
            const lendingPool = new Contract(ADDRESSES.LendingPool, LENDING_POOL_ABI, rpcProvider);
            try {
              const tokenCount = await lendingPool.getSupportedTokensCount();
              contractResults.push({
                name: 'LendingPool Contract',
                status: 'success',
                message: `Deployed and responding`,
                details: `Supported tokens: ${tokenCount.toString()}`,
                data: { address: ADDRESSES.LendingPool, tokenCount: tokenCount.toString() },
                timestamp: new Date(),
              });
              addLog('SUCCESS', `LendingPool: ${tokenCount} tokens configured`);
            } catch (callErr: any) {
              contractResults.push({
                name: 'LendingPool Contract',
                status: 'warning',
                message: 'Deployed but call failed',
                details: `getSupportedTokensCount() error: ${callErr.message}`,
                data: { address: ADDRESSES.LendingPool, error: callErr.message },
                timestamp: new Date(),
              });
              addLog('WARNING', 'LendingPool deployed but call failed', callErr.message);
            }
          } else {
            contractResults.push({
              name: 'LendingPool Contract',
              status: 'error',
              message: 'No contract at address',
              details: `Address ${ADDRESSES.LendingPool} has no code. Re-deploy contracts.`,
              timestamp: new Date(),
            });
            addLog('ERROR', 'LendingPool: No contract code at address');
          }
        } catch (err: any) {
          contractResults.push({
            name: 'LendingPool Contract',
            status: 'error',
            message: 'Failed to verify',
            details: err.message,
            timestamp: new Date(),
          });
          addLog('ERROR', 'LendingPool verification failed', err.message);
        }
      }

      // Check token contracts
      const tokens = [
        { name: 'WETH', address: ADDRESSES.WETH },
        { name: 'DAI', address: ADDRESSES.DAI },
        { name: 'USDC', address: ADDRESSES.USDC },
        { name: 'LINK', address: ADDRESSES.LINK },
      ];

      for (const token of tokens) {
        if (!token.address) {
          contractResults.push({
            name: `${token.name} Token`,
            status: 'error',
            message: 'Address not configured',
            details: `Set NEXT_PUBLIC_${token.name}_ADDRESS in .env.local`,
            timestamp: new Date(),
          });
          continue;
        }

        try {
          const code = await rpcProvider.getCode(token.address);
          const hasCode = code !== '0x' && code.length > 2;

          if (hasCode) {
            const tokenContract = new Contract(token.address, ERC20_ABI, rpcProvider);
            try {
              const [symbol, decimals] = await Promise.all([
                tokenContract.symbol(),
                tokenContract.decimals(),
              ]);
              contractResults.push({
                name: `${token.name} Token`,
                status: 'success',
                message: `${symbol} - ${decimals} decimals`,
                details: `Address: ${token.address}`,
                data: { address: token.address, symbol, decimals: Number(decimals) },
                timestamp: new Date(),
              });
              addLog('SUCCESS', `${token.name}: ${symbol}, ${decimals} decimals`);
            } catch (callErr: any) {
              contractResults.push({
                name: `${token.name} Token`,
                status: 'warning',
                message: 'Deployed but call failed',
                details: callErr.message,
                timestamp: new Date(),
              });
              addLog('WARNING', `${token.name} call failed`, callErr.message);
            }
          } else {
            contractResults.push({
              name: `${token.name} Token`,
              status: 'error',
              message: 'No contract at address',
              details: `Address ${token.address} has no code`,
              timestamp: new Date(),
            });
            addLog('ERROR', `${token.name}: No contract code`);
          }
        } catch (err: any) {
          contractResults.push({
            name: `${token.name} Token`,
            status: 'error',
            message: 'Verification failed',
            details: err.message,
            timestamp: new Date(),
          });
        }
      }

      // Check PriceOracle
      if (ADDRESSES.PriceOracle) {
        try {
          const code = await rpcProvider.getCode(ADDRESSES.PriceOracle);
          const hasCode = code !== '0x' && code.length > 2;
          
          if (hasCode) {
            const oracle = new Contract(ADDRESSES.PriceOracle, PRICE_ORACLE_ABI, rpcProvider);
            try {
              // Try to get WETH price
              if (ADDRESSES.WETH) {
                const price = await oracle.getPrice(ADDRESSES.WETH);
                contractResults.push({
                  name: 'PriceOracle Contract',
                  status: 'success',
                  message: 'Deployed and responding',
                  details: `WETH Price: ${formatUnits(price, 18)} USD`,
                  data: { address: ADDRESSES.PriceOracle, wethPrice: formatUnits(price, 18) },
                  timestamp: new Date(),
                });
                addLog('SUCCESS', `PriceOracle: WETH = $${formatUnits(price, 18)}`);
              }
            } catch (callErr: any) {
              contractResults.push({
                name: 'PriceOracle Contract',
                status: 'warning',
                message: 'Deployed but call failed',
                details: callErr.message,
                timestamp: new Date(),
              });
              addLog('WARNING', 'PriceOracle call failed', callErr.message);
            }
          } else {
            contractResults.push({
              name: 'PriceOracle Contract',
              status: 'error',
              message: 'No contract at address',
              details: `Address ${ADDRESSES.PriceOracle} has no code`,
              timestamp: new Date(),
            });
          }
        } catch (err: any) {
          contractResults.push({
            name: 'PriceOracle Contract',
            status: 'error',
            message: 'Verification failed',
            details: err.message,
            timestamp: new Date(),
          });
        }
      }

      // Check LARToken
      if (ADDRESSES.LARToken) {
        try {
          const code = await rpcProvider.getCode(ADDRESSES.LARToken);
          const hasCode = code !== '0x' && code.length > 2;
          
          if (hasCode) {
            const larToken = new Contract(ADDRESSES.LARToken, LAR_TOKEN_ABI, rpcProvider);
            try {
              const [symbol, totalSupply] = await Promise.all([
                larToken.symbol(),
                larToken.totalSupply(),
              ]);
              contractResults.push({
                name: 'LARToken Contract',
                status: 'success',
                message: `${symbol} - Total Supply: ${formatUnits(totalSupply, 18)}`,
                details: `Address: ${ADDRESSES.LARToken}`,
                data: { address: ADDRESSES.LARToken, symbol, totalSupply: formatUnits(totalSupply, 18) },
                timestamp: new Date(),
              });
              addLog('SUCCESS', `LARToken: ${symbol}, supply ${formatUnits(totalSupply, 18)}`);
            } catch (callErr: any) {
              contractResults.push({
                name: 'LARToken Contract',
                status: 'warning',
                message: 'Deployed but call failed',
                details: callErr.message,
                timestamp: new Date(),
              });
            }
          } else {
            contractResults.push({
              name: 'LARToken Contract',
              status: 'error',
              message: 'No contract at address',
              details: `Address ${ADDRESSES.LARToken} has no code`,
              timestamp: new Date(),
            });
          }
        } catch (err: any) {
          contractResults.push({
            name: 'LARToken Contract',
            status: 'error',
            message: 'Verification failed',
            details: err.message,
            timestamp: new Date(),
          });
        }
      }

      // ============ CATEGORY 5: Token Configuration in LendingPool ============
      const tokenConfigResults: DiagnosticResult[] = [];
      addLog('INFO', 'Checking token configurations in LendingPool...');

      if (ADDRESSES.LendingPool) {
        const lendingPool = new Contract(ADDRESSES.LendingPool, LENDING_POOL_ABI, rpcProvider);
        
        for (const token of tokens) {
          if (!token.address) continue;
          
          try {
            const config = await lendingPool.tokenConfigs(token.address);
            // config returns: (address tokenAddress, uint16 ltv, bool isActive)
            const isActive = config.isActive || config[2];
            const ltv = config.ltv || config[1];
            
            tokenConfigResults.push({
              name: `${token.name} Config`,
              status: isActive ? 'success' : 'error',
              message: isActive ? `Active - LTV: ${Number(ltv) / 100}%` : 'Not active in LendingPool',
              details: isActive 
                ? `LTV: ${Number(ltv) / 100}%`
                : 'Token not configured or not active. Run deployment script.',
              data: { 
                address: token.address, 
                isActive, 
                ltv: Number(ltv)
              },
              timestamp: new Date(),
            });
            addLog(isActive ? 'SUCCESS' : 'ERROR', `${token.name} config: ${isActive ? 'active' : 'inactive'}`);
          } catch (err: any) {
            tokenConfigResults.push({
              name: `${token.name} Config`,
              status: 'error',
              message: 'Failed to read config',
              details: err.message,
              timestamp: new Date(),
            });
            addLog('ERROR', `${token.name} config read failed`, err.message);
          }
        }
      }

      categories.push({
        name: 'Token Configurations',
        status: tokenConfigResults.some((r) => r.status === 'error')
          ? 'error'
          : tokenConfigResults.some((r) => r.status === 'warning')
          ? 'warning'
          : 'success',
        results: tokenConfigResults,
      });
    }

    categories.push({
      name: 'Smart Contracts',
      status: contractResults.some((r) => r.status === 'error')
        ? 'error'
        : contractResults.some((r) => r.status === 'warning')
        ? 'warning'
        : 'success',
      results: contractResults,
    });

    addLog('INFO', 'Diagnostic checks complete');

    setState((prev) => ({
      ...prev,
      isRunning: false,
      lastRun: new Date(),
      categories,
    }));
  }, [addLog]);

  // Auto-retry functionality
  useEffect(() => {
    if (autoRetryInterval && autoRetryInterval > 0) {
      const interval = setInterval(() => {
        runDiagnostics();
      }, autoRetryInterval);
      return () => clearInterval(interval);
    }
  }, [autoRetryInterval, runDiagnostics]);

  // Run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  return {
    ...state,
    runDiagnostics,
    clearLogs,
  };
}
