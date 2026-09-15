import { useCallback, useEffect, useState } from 'react'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { managerApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { ErrorBanner, LoadingIndicator, PageHeader, StatCard } from '../../components/ui'
import type { ReportSummary } from '../../types'

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState<ReportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    managerApi
      .reportSummary()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Manager'}`}
        subtitle="Overview of onboarding activity across your tower and teams"
      />

      {error && <ErrorBanner message={error} />}

      {!data ? (
        <LoadingIndicator />
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="New Joiners" value={data.total_joiners} icon={<GroupOutlinedIcon />} color="#0D47A1" accent />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="Completed Training" value={data.completed} icon={<CheckCircleOutlinedIcon />} color="#2E7D32" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="In Progress" value={data.in_progress} icon={<PlayCircleOutlineOutlinedIcon />} color="#1565C0" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="Not Started" value={data.not_started} icon={<ScheduleOutlinedIcon />} color="#546E7A" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="Overdue" value={data.overdue} icon={<WarningAmberOutlinedIcon />} color="#C62828" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="Completion" value={`${data.completion_percentage}%`} icon={<AssessmentOutlinedIcon />} color="#EF6C00" />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper>
                <Box sx={{ p: 2, borderBottom: '1px solid #E3E8EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Completion by Team</Typography>
                  <Button size="small" endIcon={<OpenInNewOutlinedIcon />} onClick={() => navigate('/manager/reports')}>
                    Full report
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Team</TableCell>
                        <TableCell>New Joiners</TableCell>
                        <TableCell>Assigned</TableCell>
                        <TableCell sx={{ width: 220 }}>Completion</TableCell>
                        <TableCell>Overdue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.team_breakdown.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No teams with New Joiners yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.team_breakdown.map((t) => (
                          <TableRow key={t.team_id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{t.team_name}</TableCell>
                            <TableCell>{t.total_joiners}</TableCell>
                            <TableCell>{t.total_assignments}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={t.completion_percentage}
                                  color={t.completion_percentage >= 100 ? 'success' : 'primary'}
                                  sx={{ flexGrow: 1, height: 8, borderRadius: 3 }}
                                />
                                <Typography variant="caption" sx={{ width: 44, textAlign: 'right' }}>
                                  {t.completion_percentage}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography color={t.overdue > 0 ? 'error' : 'text.secondary'} variant="body2">
                                {t.overdue}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'Enroll New Joiner', path: '/manager/joiners' },
                      { label: 'Assign Training', path: '/manager/assignments' },
                      { label: 'Manage Modules', path: '/manager/modules' },
                      { label: 'View Feedback', path: '/manager/feedback' },
                      { label: 'Generate Report', path: '/manager/reports' },
                    ].map((action) => (
                      <Grid size={12} key={action.label}>
                        <Button
                          variant="outlined"
                          fullWidth
                          sx={{ justifyContent: 'space-between', py: 1.4 }}
                          onClick={() => navigate(action.path)}
                        >
                          {action.label}
                          <OpenInNewOutlinedIcon fontSize="small" sx={{ ml: 1 }} />
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}