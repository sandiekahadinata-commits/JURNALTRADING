import { z } from 'zod'

export const tradeFormSchema = z
  .object({
    entryDate: z.string().min(1, 'Tanggal entry wajib diisi'),
    exitDate: z.string().min(1, 'Tanggal exit wajib diisi'),
    symbol: z.string().trim().min(1, 'Symbol wajib diisi'),
    direction: z.enum(['Long', 'Short']),
    timeframe: z.enum(['15m', '1H', '4H', '1D', '1W']),
    entryPrice: z
      .number({ invalid_type_error: 'Wajib diisi' })
      .positive('Harus lebih dari 0'),
    stopLoss: z
      .number({ invalid_type_error: 'Wajib diisi' })
      .positive('Harus lebih dari 0'),
    takeProfit: z
      .number({ invalid_type_error: 'Wajib diisi' })
      .positive('Harus lebih dari 0'),
    positionSize: z
      .number({ invalid_type_error: 'Wajib diisi' })
      .positive('Harus lebih dari 0'),
    result: z.enum(['Win', 'Loss', 'Break Even']),
    exitPrice: z
      .number({ invalid_type_error: 'Wajib diisi' })
      .positive('Harus lebih dari 0'),
    pnl: z
      .number({ invalid_type_error: 'Wajib berupa angka' })
      .finite('Wajib berupa angka'),
    setupTag: z.string().optional(),
    session: z.enum(['Asia', 'London', 'New York', 'Overlap']).optional(),
    notes: z.string().optional(),
    screenshotUrl: z
      .string()
      .trim()
      .url('URL tidak valid')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.exitDate >= data.entryDate, {
    message: 'Tanggal exit tidak boleh sebelum tanggal entry',
    path: ['exitDate'],
  })

export type TradeFormValues = z.infer<typeof tradeFormSchema>
