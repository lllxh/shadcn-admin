import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  clicks: {
    label: 'Clicks',
    color: 'var(--chart-1)',
  },
  uniques: {
    label: 'Unique Visitors',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const data = [
  {
    name: 'Mon',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: 'Tue',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: 'Wed',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: 'Thu',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: 'Fri',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: 'Sat',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: 'Sun',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
]

export function AnalyticsChart() {
  return (
    <ChartContainer config={chartConfig} className='h-[300px] w-full'>
      <AreaChart accessibilityLayer data={data}>
        <XAxis dataKey='name' fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent indicator='line' className='min-w-44' />
          }
        />
        <Area
          type='monotone'
          dataKey='clicks'
          stroke='var(--color-clicks)'
          fill='var(--color-clicks)'
          fillOpacity={0.15}
        />
        <Area
          type='monotone'
          dataKey='uniques'
          stroke='var(--color-uniques)'
          fill='var(--color-uniques)'
          fillOpacity={0.1}
        />
      </AreaChart>
    </ChartContainer>
  )
}
