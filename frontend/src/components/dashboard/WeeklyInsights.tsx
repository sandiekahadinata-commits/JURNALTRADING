import { Lightbulb } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function WeeklyInsights({ insights }: { insights: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Insight Mingguan</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {insights.map((text, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span className="text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
