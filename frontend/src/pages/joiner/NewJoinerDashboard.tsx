import { useCallback, useEffect, useState } from 'react'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { meApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { CONTENT_TYPE_LABELS, ErrorBanner, LoadingIndicator, StatCard, StatusChip, formatDate } from '../../components/ui'
import type { NewJoinerDashboard as DashboardData } from '../../types'

export default function NewJoinerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    meApi
      .dashboard()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Box>
      {error && <ErrorBanner message={error} />}

      {!data ? (
        <LoadingIndicator />
      ) : (
        <>
          <Card sx={{ mb: 3, background: 'linear-gradient(120deg, #0D47A1, #1E88E5)', color: 'white' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 🎉
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    {data.profile.tower_name ?? '—'} · {data.profile.team_name ?? '—'}
                  </Typography>
                  {data.profile.manager_name && (
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>
                      Your Manager: {data.profile.manager_name}
                    </Typography>
                  )}
                </Box>
                <Chip
                  icon={<SchoolOutlinedIcon />}
                  label={`${data.summary.completion_percentage}% overall progress`}
                  sx={{ backgroundColor: 'rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(4px)' }}
                />
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Assigned Modules" value={data.summary.total_assignments} icon={<SchoolOutlinedIcon />} color="#0D47A1" accent />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Completed" value={data.summary.completed} icon={<CheckCircleOutlinedIcon />} color="#2E7D32" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="In Progress" value={data.summary.in_progress} icon={<PlayCircleOutlineOutlinedIcon />} color="#1565C0" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Not Started" value={data.summary.not_started} icon={<ScheduleOutlinedIcon />} color="#546E7A" />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Next Due
                  </Typography>
                  {data.next_due ? (
                    <Stack spacing={1}>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{data.next_due.training_module_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {CONTENT_TYPE_LABELS[data.next_due.training_module_content_type as keyof typeof CONTENT_TYPE_LABELS] ?? data.next_due.training_module_content_type}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <EventOutlinedIcon fontSize="small" color={data.next_due.overdue ? 'error' : 'action'} />
                        <Typography variant="body2" color={data.next_due.overdue ? 'error' : 'text.secondary'}>
                          {data.next_due.overdue ? 'Overdue — ' : 'Due '}
                          {formatDate(data.next_due.due_date)}
                        </Typography>
                      </Stack>
                      <StatusChip status={data.next_due.status} />
                      <Button variant="outlined" onClick={() => navigate('/join/training')} sx={{ mt: 1 }}>
                        Open My Training
                      </Button>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No upcoming training — check back after your Manager assigns modules.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Overall Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={data.summary.completion_percentage}
                      color={data.summary.completion_percentage >= 100 ? 'success' : 'primary'}
                      sx={{ flexGrow: 1, height: 14, borderRadius: 4 }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {data.summary.completion_percentage}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 4, mt: 2, flexWrap: 'wrap' }}>
                    <ProgressStat color="#2E7D32" label="Completed" value={data.summary.completed} />
                    <ProgressStat color="#1565C0" label="In Progress" value={data.summary.in_progress} />
                    <ProgressStat color="#546E7A" label="Not Started" value={data.summary.not_started} />
                    {data.summary.overdue > 0 && <ProgressStat color="#C62828" label="Overdue" value={data.summary.overdue} />}
                  </Box>
                </CardContent>
              </Card>

              <Paper sx={{ mt: 3 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #E3E8EF' }}>
                  <Typography variant="h6">Recent Training</Typography>
                </Box>
                <Stack divider={<Box component="hr" sx={{ border: 'none', borderTop: '1px solid #E3E8EF', m: 0 }} />}>
                  {data.recent.map((assignment) => (
                    <Box key={assignment.id} sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <StatusChip status={assignment.status} />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {assignment.training_module_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(assignment.due_date)} · {assignment.progress}%
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

function ProgressStat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}