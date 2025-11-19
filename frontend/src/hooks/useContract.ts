'use client';

import { useMemo } from 'react';
import { Contract } from 'ethers';
import { useWeb3 } from './useWeb3';
import {
  LENDING_POOL_ABI,
  LAR_TOKEN_ABI,
  ERC20_ABI,
  PRICE_ORACLE_ABI,
  INTEREST_RATE_MODEL_ABI,
  ADDRESSES,
} from '@/lib/contracts';

type ContractName = 'LendingPool' | 'LARToken' | 'ERC20' | 'PriceOracle' | 'InterestRateModel';

export function useContract(contractName: ContractName, address?: string) {
  const { signer, provider } = useWeb3();

  const contract = useMemo(() => {
    if (!signer && !provider) return null;

    let abi: any[];
    let contractAddress: string;

    switch (contractName) {
      case 'LendingPool':
        abi = LENDING_POOL_ABI;
        contractAddress = address || ADDRESSES.LendingPool;
        break;
      case 'LARToken':
        abi = LAR_TOKEN_ABI;
        contractAddress = address || ADDRESSES.LARToken;
        break;
      case 'ERC20':
        abi = ERC20_ABI;
        contractAddress = address || '';
        break;
      case 'PriceOracle':
        abi = PRICE_ORACLE_ABI;
        contractAddress = address || ADDRESSES.PriceOracle;
        break;
      case 'InterestRateModel':
        abi = INTEREST_RATE_MODEL_ABI;
        contractAddress = address || ADDRESSES.InterestRateModel;
        break;
      default:
        return null;
    }

    if (!contractAddress) return null;

    return new Contract(contractAddress, abi, signer || provider);
  }, [contractName, address, signer, provider]);

  return contract;
}
