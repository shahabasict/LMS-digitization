import { useCallback, useEffect, useState } from 'react'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { apiClient } from '../../api/client'
import { managerApi, masterApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorBanner, LoadingIndicator, PageHeader, ProgressBar, StatCard } from '../../components/ui'
import type { ReportRow, ReportSummary, Team } from '../../types'

export default function ReportsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamFilter, setTeamFilter] = useState('')
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((teamId?: string) => {
    setError(null)
    Promise.all([managerApi.reportSummary(teamId || undefined), managerApi.teamReport(teamId || undefined)])
      .then(([sum, report]) => {
        setSummary(sum)
        setRows(report.rows)
      })
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  useEffect(() => {
    load()
    masterApi.teams().then(setTeams).catch(() => undefined)
  }, [load])

  const exportCsv = async () => {
    const response = await apiClient.get('/reports/team', {
      params: teamFilter ? { team_id: teamFilter, format: 'csv' } : { format: 'csv' },
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `training-report${teamFilter ? '-filtered' : ''}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Box>
      <PageHeader
        title="Team Reports"
        subtitle="Individual and team-level training progress across your teams"
        actions={
          <Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </Button>
        }
      />

      <Paper sx={{ mb: 2, p: 1.5 }}>
        <Toolbar disableGutters sx={{ gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Team"
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value)
              load(e.target.value)
            }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All teams</MenuItem>
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {rows.length} New Joiner{rows.length === 1 ? '' : 's'}
          </Typography>
        </Toolbar>
      </Paper>

      {error && <ErrorBanner message={error} />}

      {!summary ? (
        <LoadingIndicator />
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="New Joiners" value={summary.total_joiners} icon={<GroupOutlinedIcon />} color="#0D47A1" accent />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="Completed" value={summary.completed} icon={<CheckCircleOutlinedIcon />} color="#2E7D32" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="In Progress" value={summary.in_progress} icon={<PlayCircleOutlineOutlinedIcon />} color="#1565C0" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="Not Started" value={summary.not_started} icon={<ScheduleOutlinedIcon />} color="#546E7A" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="Overdue" value={summary.overdue} icon={<WarningAmberOutlinedIcon />} color="#C62828" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <StatCard label="Completion" value={`${summary.completion_percentage}%`} icon={<ScheduleOutlinedIcon />} color="#EF6C00" />
            </Grid>
          </Grid>

          <Paper>
            <Box sx={{ p: 2, borderBottom: '1px solid #E3E8EF' }}>
              <Typography variant="h6">Per New Joiner Breakdown</Typography>
            </Box>
            {rows.length === 0 ? (
              <EmptyState title="No data to report" hint="Assign training to New Joiners to see report rows" />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>New Joiner</TableCell>
                      <TableCell>Team</TableCell>
                      <TableCell>Assigned</TableCell>
                      <TableCell>Completed</TableCell>
                      <TableCell>In Progress</TableCell>
                      <TableCell>Not Started</TableCell>
                      <TableCell>Overdue</TableCell>
                      <TableCell sx={{ width: 190 }}>Completion</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.joiner_id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{row.joiner_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.employee_id || row.username}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.team_name}</TableCell>
                        <TableCell>{row.total_assignments}</TableCell>
                        <TableCell>{row.completed}</TableCell>
                        <TableCell>{row.in_progress}</TableCell>
                        <TableCell>{row.not_started}</TableCell>
                        <TableCell>
                          <Typography color={row.overdue > 0 ? 'error' : 'text.secondary'}>{row.overdue}</Typography>
                        </TableCell>
                        <TableCell>
                          <ProgressBar value={row.completion_percentage} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}
    </Box>
  )
}