import type { ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import type { AssignmentStatus, ContentType } from '../types'

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  pdf: 'PDF / Document',
  internal_link: 'Internal Link',
  external_link: 'External Link',
  percipio: 'Percipio',
}

const STATUS_META: Record<
  string,
  { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }
> = {
  not_started: { label: 'Not Started', color: 'default' },
  in_progress: { label: 'In Progress', color: 'primary' },
  completed: { label: 'Completed', color: 'success' },
  overdue: { label: 'Overdue', color: 'error' },
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'default' },
}

export function StatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'default' as const }
  return <Chip size="small" label={meta.label} color={meta.color} />
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  )
}

export function StatCard({
  label,
  value,
  icon,
  color = '#1565C0',
  accent = false,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  color?: string
  accent?: boolean
}) {
  return (
    <Paper
      sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderTop: accent ? `4px solid ${color}` : undefined,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}1A`,
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2, color }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Box>
    </Paper>
  )
}

export function ProgressBar({
  value,
  colorByStatus,
}: {
  value: number
  colorByStatus?: AssignmentStatus
}) {
  let color: 'primary' | 'success' | 'warning' = 'primary'
  if (colorByStatus === 'completed' || value >= 100) color = 'success'
  else if (colorByStatus === 'in_progress') color = 'warning'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={value}
        color={color}
        sx={{ flexGrow: 1, borderRadius: 3, height: 8 }}
      />
      <Typography variant="caption" sx={{ width: 40, textAlign: 'right', color: 'text.secondary' }}>
        {value}%
      </Typography>
    </Box>
  )
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string
  hint?: string
  icon?: ReactNode
}) {
  return (
    <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
      {icon && <Box sx={{ mb: 1, fontSize: 42, color: '#B0BEC5' }}>{icon}</Box>}
      <Typography variant="h6" color="text.primary">
        {title}
      </Typography>
      {hint && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  )
}

export function LoadingIndicator() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  )
}

export function ErrorBanner({ message, sx }: { message: string; sx?: SxProps<Theme> }) {
  return (
    <Alert severity="error" sx={{ mb: 2, ...sx }}>
      {message}
    </Alert>
  )
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}