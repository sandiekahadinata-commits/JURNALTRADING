import { z } from 'zod'

export const configFormSchema = z.object({
  accountBalance: z
    .number({ invalid_type_error: 'Wajib diisi' })
    .nonnegative('Tidak boleh negatif'),
  riskPercent: z
    .number({ invalid_type_error: 'Wajib diisi' })
    .positive('Harus lebih dari 0')
    .max(100, 'Maksimal 100%'),
  targetWinRate: z
    .number({ invalid_type_error: 'Wajib diisi' })
    .min(0, 'Minimal 0%')
    .max(100, 'Maksimal 100%'),
  setupTags: z.array(z.string().trim().min(1)).min(1, 'Minimal 1 setup tag'),
})

export type ConfigFormValues = z.infer<typeof configFormSchema>
