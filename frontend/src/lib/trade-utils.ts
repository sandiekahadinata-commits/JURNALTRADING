import { RISK_REWARD_RATIO, RR_TOLERANCE } from '@/lib/constants'
import type { Trade, TradeResult } from '@/types/journal.types'

export interface TradeInput {
  entryDate: string
  exitDate: string
  symbol: string
  direction: Trade['direction']
  timeframe: Trade['timeframe']
  entryPrice: number
  stopLoss: number
  takeProfit: number
  positionSize: number
  result: TradeResult
  exitPrice: number
  pnl: number
  setupTag?: string
  session?: Trade['session']
  notes?: string
  screenshotUrl?: string
}

/** Risk per Trade = |Entry - SL| x size / Entry. */
export function computeRiskPerTrade(input: {
  entryPrice: number
  stopLoss: number
  positionSize: number
}): number {
  const { entryPrice, stopLoss, positionSize } = input
  if (!entryPrice) return 0
  return (Math.abs(entryPrice - stopLoss) * positionSize) / entryPrice
}

/** R-Multiple = P&L Aktual / Risk per Trade. */
export function computeRMultiple(pnl: number, riskPerTrade: number): number {
  if (!riskPerTrade) return 0
  return pnl / riskPerTrade
}

/** Risk efektif per unit (jarak Entry ke SL). */
export function computeRiskDistance(
  entryPrice: number,
  stopLoss: number,
): number {
  return Math.abs(entryPrice - stopLoss)
}

/** TP ideal untuk RR 1:3 sesuai arah posisi. */
export function computeIdealTakeProfit(
  entryPrice: number,
  stopLoss: number,
  direction: Trade['direction'],
): number {
  const risk = computeRiskDistance(entryPrice, stopLoss)
  return direction === 'Long'
    ? entryPrice + RISK_REWARD_RATIO * risk
    : entryPrice - RISK_REWARD_RATIO * risk
}

export interface RRValidation {
  valid: boolean
  expectedTp: number
  deviationPct: number
  message: string
}

/** Validasi TP terhadap RR 1:3 dengan toleransi. */
export function validateRR(input: {
  entryPrice: number
  stopLoss: number
  takeProfit: number
  direction: Trade['direction']
}): RRValidation {
  const { entryPrice, stopLoss, takeProfit, direction } = input
  const expectedTp = computeIdealTakeProfit(entryPrice, stopLoss, direction)

  if (!expectedTp) {
    return {
      valid: false,
      expectedTp,
      deviationPct: 0,
      message: 'Entry price belum valid',
    }
  }

  const deviationPct = Math.abs(takeProfit - expectedTp) / Math.abs(expectedTp)
  const valid = deviationPct <= RR_TOLERANCE

  return {
    valid,
    expectedTp,
    deviationPct,
    message: valid
      ? `TP konsisten dengan RR 1:${RISK_REWARD_RATIO}`
      : `TP tidak konsisten dengan RR 1:${RISK_REWARD_RATIO}. Idealnya ${expectedTp.toFixed(4)} (deviasi ${(deviationPct * 100).toFixed(2)}%)`,
  }
}

/** Urutkan trade berdasarkan Tanggal Exit (terbaru dulu). */
export function sortTradesByExitDesc(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => b.exitDate.localeCompare(a.exitDate))
}
