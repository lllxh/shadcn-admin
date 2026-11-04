import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  total: {
    label: 'Revenue',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const data = [
  {
    name: 'Jan',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Feb',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Mar',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Apr',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'May',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Jun',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Jul',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Aug',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Sep',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Oct',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Nov',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: 'Dec',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
]

export function Overview() {
  return (
    <ChartContainer config={chartConfig} className='h-[350px] w-full'>
      <BarChart accessibilityLayer data={data}>
        <XAxis dataKey='name' fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          direction='ltr'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <>
                  <span className='text-muted-foreground'>Revenue</span>
                  <span className='ms-auto font-mono font-medium tabular-nums'>
                    ${Number(value).toLocaleString()}
                  </span>
                </>
              )}
            />
          }
        />
        <Bar dataKey='total' fill='var(--color-total)' radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
