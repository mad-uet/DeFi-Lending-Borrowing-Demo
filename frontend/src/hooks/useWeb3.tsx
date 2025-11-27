'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Signer } from 'ethers';
import { Web3State } from '@/types';
import toast from 'react-hot-toast';
import { CHAIN_ID } from '@/lib/contracts';

const Web3Context = createContext<Web3State | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number>(0);

  const switchNetwork = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${CHAIN_ID.toString(16)}`,
                chainName: 'Hardhat Local',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          toast.error('Failed to add network');
        }
      } else {
        console.error('Error switching network:', switchError);
        toast.error('Failed to switch network');
      }
    }
  };

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('MetaMask is not installed');
      return;
    }

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);

      const signer = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAccount('');
    setChainId(0);
    setIsConnected(false);
    toast.success('Wallet disconnected');
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        toast.success('Account changed');
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      toast.success('Network changed');
      // Reload to avoid state inconsistencies
      window.location.reload();
    };

    const handleDisconnect = () => {
      disconnect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [account]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window.ethereum === 'undefined') return;

      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_accounts', []);
        
        if (accounts.length > 0) {
          const signer = await browserProvider.getSigner();
          const network = await browserProvider.getNetwork();

          setProvider(browserProvider);
          setSigner(signer);
          setAccount(accounts[0]);
          setChainId(Number(network.chainId));
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
      }
    };

    autoConnect();
  }, []);

  const value: Web3State = {
    provider,
    signer,
    account,
    isConnected,
    chainId,
    connect,
    disconnect,
    switchNetwork,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

