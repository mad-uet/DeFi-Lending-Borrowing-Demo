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
  healthFactorTrend: HealthFactorTrend;
  lastAlertTime: number | null;
  alertCooldown: boolean;
}

export function useLiquidationMonitor() {
  const { accountData, isLoading } = useUserAccountData();
  const { notifyLiquidationRisk } = useTransactionNotifications();
  
  const previousHealthFactorRef = useRef<number | null>(null);
  const lastAlertTimeRef = useRef<number>(0);
  
  const [state, setState] = useState<LiquidationMonitorState>({
    isAtRisk: false,
    isDanger: false,
    healthFactorTrend: {
      current: Infinity,
      previous: Infinity,
      trend: 'stable',
      changePercent: 0,
    },
    lastAlertTime: null,
    alertCooldown: false,
  });

  const ALERT_COOLDOWN_MS = 30000; // 30 seconds between alerts
  const RISK_THRESHOLD = 1.2;
  const DANGER_THRESHOLD = 1.0;

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

    // Check if we should send an alert
    const now = Date.now();
    const canAlert = now - lastAlertTimeRef.current > ALERT_COOLDOWN_MS;

    // Send alert if entering risk zone and not in cooldown
    if (isDanger && canAlert && !state.isDanger) {
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
      healthFactorTrend: {
        current: currentHF,
        previous: previousHF ?? Infinity,
        trend,
        changePercent,
      },
      lastAlertTime: lastAlertTimeRef.current,
      alertCooldown: !canAlert,
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
