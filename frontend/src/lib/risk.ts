import type { Trade } from '@/types/journal.types'

/**
 * Strategi transisi risiko: posisi selalu dihitung sebagai persentase dari
 * saldo terkini, namun persentasenya mengecil seiring modal membesar.
 * Tier ditentukan berdasarkan saldo (modal awal + akumulasi P&L).
 */
export interface RiskTier {
  /** Ambang batas bawah saldo (inklusif) dalam USDT. */
  minBalance: number
  /** Persentase risiko per trade pada tier ini. */
  percent: number
  /** Label fase strategi. */
  phase: string
}

/** Tangga tier, urut menaik berdasarkan minBalance. */
export const RISK_TIERS: RiskTier[] = [
  { minBalance: 0, percent: 8, phase: 'Mikro / Pertumbuhan Agresif' },
  { minBalance: 200, percent: 7, phase: 'Pertumbuhan' },
  { minBalance: 500, percent: 6, phase: 'Pertumbuhan' },
  { minBalance: 1000, percent: 5, phase: 'Transisi' },
  { minBalance: 2000, percent: 4, phase: 'Proteksi Awal' },
  { minBalance: 3000, percent: 3, phase: 'Proteksi' },
  { minBalance: 5000, percent: 2, phase: 'Proteksi' },
  { minBalance: 10000, percent: 1, phase: 'Proteksi Kuat' },
]

/** Tier aktif untuk saldo tertentu. */
export function resolveRiskTier(balance: number): RiskTier {
  const safe = Number.isFinite(balance) ? balance : 0
  for (let i = RISK_TIERS.length - 1; i >= 0; i -= 1) {
    if (safe >= RISK_TIERS[i].minBalance) return RISK_TIERS[i]
  }
  return RISK_TIERS[0]
}

/** Tier berikutnya (lebih tinggi) yang akan menurunkan risiko. */
export function getNextTier(balance: number): RiskTier | null {
  const safe = Number.isFinite(balance) ? balance : 0
  for (let i = 0; i < RISK_TIERS.length; i += 1) {
    if (RISK_TIERS[i].minBalance > safe) return RISK_TIERS[i]
  }
  return null
}

/** Saldo terkini = modal awal + akumulasi P&L semua trade. */
export function computeCurrentBalance(
  initialBalance: number,
  trades: Trade[],
): number {
  const base = Number.isFinite(initialBalance) ? initialBalance : 0
  const pnl = trades.reduce(
    (sum, trade) => sum + (Number.isFinite(trade.pnl) ? trade.pnl : 0),
    0,
  )
  return base + pnl
}

/** Nilai risiko per trade (USDT) dari saldo dan persentase tier. */
export function computeRiskAmount(balance: number, percent: number): number {
  if (!Number.isFinite(balance) || !Number.isFinite(percent)) return 0
  return (balance * percent) / 100
}

/**
 * Ukuran posisi saran (USDT) agar risiko tepat sebesar riskAmount.
 * positionSize = riskAmount / (|entry - SL| / entry)
 */
export function computeRecommendedPositionSize(input: {
  balance: number
  percent: number
  entryPrice: number
  stopLoss: number
}): number {
  const { balance, percent, entryPrice, stopLoss } = input
  const riskAmount = computeRiskAmount(balance, percent)
  const distance = Math.abs(entryPrice - stopLoss)
  if (!entryPrice || !distance) return 0
  return (riskAmount * entryPrice) / distance
}
