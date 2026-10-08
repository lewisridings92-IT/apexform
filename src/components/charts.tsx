import {
  Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { compactKg, type ProgressPoint, shortDate, type WeekVolume } from '@/lib/stats'

// Shared chart styling: recessive axes and grid, text in text colours (never series colours).
const AXIS = { stroke: 'var(--border)', tick: { fill: 'var(--muted-foreground)', fontSize: 12 }, tickLine: false }
const GRID = { stroke: 'var(--border)', strokeDasharray: '0', vertical: false }

const kg = (n: number) => `${Number(n.toFixed(1))} kg`


function TooltipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {children}
    </div>
  )
}

function Swatch({ color }: { color: string }) {
  return <span className="inline-block h-0.5 w-3 rounded-full align-middle" style={{ background: color }} />
}

// ── Exercise progress: estimated 1RM and top weight, both in kg on one axis ──

export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const last = points.length - 1
  return (
    <figure>
      <figcaption className="mb-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Swatch color="var(--series-1)" />Estimated 1RM</span>
        <span className="flex items-center gap-1.5"><Swatch color="var(--series-2)" />Top weight</span>
      </figcaption>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 16, right: 40, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="date" {...AXIS} tickFormatter={(d: string) => shortDate(d)} minTickGap={24} />
            <YAxis {...AXIS} axisLine={false} width={44} domain={['auto', 'auto']} tickFormatter={(n: number) => String(n)} />
            <Tooltip
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as ProgressPoint
                return (
                  <TooltipCard>
                    <div className="mb-1 font-medium">{shortDate(p.date)}</div>
                    <div className="flex items-center gap-1.5"><Swatch color="var(--series-1)" />e1RM {kg(p.e1rm)}</div>
                    <div className="flex items-center gap-1.5"><Swatch color="var(--series-2)" />Top weight {kg(p.topWeight)}</div>
                    <div className="mt-1 text-muted-foreground">Best set {kg(p.topSet.weight)} × {p.topSet.reps}</div>
                  </TooltipCard>
                )
              }}
            />
            {(['e1rm', 'topWeight'] as const).map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`var(--series-${i + 1})`}
                strokeWidth={2}
                dot={{ r: 4, fill: `var(--series-${i + 1})`, stroke: 'var(--card)', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: `var(--series-${i + 1})`, stroke: 'var(--card)', strokeWidth: 2 }}
                isAnimationActive={false}
              >
                {/* Direct label on the latest point only. */}
                <LabelList
                  dataKey={key}
                  content={({ x, y, value, index }) =>
                    index === last ? (
                      <text x={Number(x) + 8} y={Number(y) + 4} fontSize={12} fill="var(--foreground)">
                        {Math.round(Number(value))}
                      </text>
                    ) : null
                  }
                />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}

// ── Weekly volume: one series, bars ──

export function VolumeChart({ weeks }: { weeks: WeekVolume[] }) {
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeks} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="week" {...AXIS} tickFormatter={(d: string) => shortDate(d)} minTickGap={16} />
          <YAxis {...AXIS} axisLine={false} width={44} tickFormatter={compactKg} />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const w = payload[0].payload as WeekVolume
              return (
                <TooltipCard>
                  <div className="mb-1 font-medium">Week of {shortDate(w.week)}</div>
                  <div>{w.volume ? `${compactKg(w.volume)} kg` : 'No sessions'}</div>
                  {w.sessions > 0 && (
                    <div className="text-muted-foreground">
                      {w.sessions} {w.sessions === 1 ? 'session' : 'sessions'}
                    </div>
                  )}
                </TooltipCard>
              )
            }}
          />
          <Bar dataKey="volume" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
