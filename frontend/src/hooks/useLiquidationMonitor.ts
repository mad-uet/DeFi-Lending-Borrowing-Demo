'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUserAccountData } from './useUserAccountData';
import { useTransactionNotifications } from './useNotifications';

interface HealthFactorTrend {
  current: number;
  previous: number;
  trend: 'improving' | 'worsening' | 'stable';
  changePercent: number;
}

interface LiquidationMonitorState {
  isAtRisk: boolean;
  isDanger: boolean;
  isLiquidatable: boolean; // NEW: True when HF < 1.0
  healthFactorTrend: HealthFactorTrend;
  lastAlertTime: number | null;
  alertCooldown: boolean;
  liquidationEligibleSince: number | null; // Timestamp when position became liquidatable
}

export function useLiquidationMonitor() {
  const { accountData, isLoading } = useUserAccountData();
  const { notifyLiquidationRisk } = useTransactionNotifications();
  
  const previousHealthFactorRef = useRef<number | null>(null);
  const lastAlertTimeRef = useRef<number>(0);
  
  const [state, setState] = useState<LiquidationMonitorState>({
    isAtRisk: false,
    isDanger: false,
    isLiquidatable: false,
    healthFactorTrend: {
      current: Infinity,
      previous: Infinity,
      trend: 'stable',
      changePercent: 0,
    },
    lastAlertTime: null,
    alertCooldown: false,
    liquidationEligibleSince: null,
  });

  const ALERT_COOLDOWN_MS = 30000; // 30 seconds between alerts
  const RISK_THRESHOLD = 1.2;
  const DANGER_THRESHOLD = 1.05;
  const LIQUIDATION_THRESHOLD = 1.0; // Position is liquidatable below this

  useEffect(() => {
    if (isLoading) return;

    const currentHF = accountData.healthFactor;
    const previousHF = previousHealthFactorRef.current;

    // Calculate trend
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    let changePercent = 0;

    if (previousHF !== null && isFinite(previousHF) && isFinite(currentHF)) {
      const change = currentHF - previousHF;
      changePercent = previousHF !== 0 ? (change / previousHF) * 100 : 0;
      
      if (Math.abs(changePercent) > 1) { // More than 1% change
        trend = change > 0 ? 'improving' : 'worsening';
      }
    }

    const isAtRisk = isFinite(currentHF) && currentHF < RISK_THRESHOLD;
    const isDanger = isFinite(currentHF) && currentHF < DANGER_THRESHOLD;
    const isLiquidatable = isFinite(currentHF) && currentHF < LIQUIDATION_THRESHOLD;

    // Track when position became liquidatable
    let liquidationEligibleSince = state.liquidationEligibleSince;
    if (isLiquidatable && !state.isLiquidatable) {
      // Just became liquidatable
      liquidationEligibleSince = Date.now();
    } else if (!isLiquidatable && state.isLiquidatable) {
      // No longer liquidatable
      liquidationEligibleSince = null;
    }

    // Check if we should send an alert
    const now = Date.now();
    const canAlert = now - lastAlertTimeRef.current > ALERT_COOLDOWN_MS;

    // Send alert if entering liquidation zone or danger zone
    if (isLiquidatable && canAlert && !state.isLiquidatable) {
      notifyLiquidationRisk(currentHF);
      lastAlertTimeRef.current = now;
    } else if (isDanger && !isLiquidatable && canAlert && !state.isDanger) {
      notifyLiquidationRisk(currentHF);
      lastAlertTimeRef.current = now;
    } else if (isAtRisk && !isDanger && canAlert && !state.isAtRisk) {
      // Only alert on risk if not already in danger
      notifyLiquidationRisk(currentHF);
      lastAlertTimeRef.current = now;
    }

    setState({
      isAtRisk,
      isDanger,
      isLiquidatable,
      healthFactorTrend: {
        current: currentHF,
        previous: previousHF ?? Infinity,
        trend,
        changePercent,
      },
      lastAlertTime: lastAlertTimeRef.current,
      alertCooldown: !canAlert,
      liquidationEligibleSince,
    });

    previousHealthFactorRef.current = currentHF;
  }, [accountData.healthFactor, isLoading, notifyLiquidationRisk, state.isAtRisk, state.isDanger]);

  const resetAlertCooldown = useCallback(() => {
    lastAlertTimeRef.current = 0;
    setState(prev => ({ ...prev, alertCooldown: false }));
  }, []);

  return {
    ...state,
    resetAlertCooldown,
    isMonitoring: !isLoading,
  };
}
