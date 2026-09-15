import { useCallback, useEffect, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useNavigate, useParams } from 'react-router-dom'
import { managerApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { CONTENT_TYPE_LABELS, ErrorBanner, EmptyState, LoadingIndicator, PageHeader, ProgressBar, StatCard, StatusChip, formatDate } from '../../components/ui'
import type { ProgressSummary, TrainingAssignment } from '../../types'

const EMPTY: ProgressSummary = {
  total_assignments: 0,
  completed: 0,
  in_progress: 0,
  not_started: 0,
  overdue: 0,
  completion_percentage: 0,
}

export default function NewJoinerDetailPage() {
  const { joinerId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<{
    joiner: Awaited<ReturnType<typeof managerApi.joinerProgress>>['joiner']
    assignments: TrainingAssignment[]
    summary: ProgressSummary
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrainingAssignment | null>(null)

  const load = useCallback(async () => {
    if (!joinerId) return
    setLoading(true)
    setError(null)
    try {
      const result = await managerApi.joinerProgress(joinerId)
      setData(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [joinerId])

  useEffect(() => {
    load()
  }, [load])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await managerApi.deleteAssignment(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  if (loading) return <LoadingIndicator />

  const joiner = data?.joiner
  const assignments = data?.assignments ?? []
  const summary = data?.summary ?? EMPTY

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/manager/joiners')}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        All New Joiners
      </Button>

      {error && <ErrorBanner message={error} />}

      {joiner && (
        <PageHeader
          title={joiner.name}
          subtitle={`${joiner.tower_name ?? '—'} · ${joiner.team_name ?? '—'} · ${joiner.employee_id ?? ''}`}
        />
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Completed Training" value={summary.completed} icon={<CheckCircleOutlinedIcon />} color="#2E7D32" accent />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="In Progress" value={summary.in_progress} icon={<PlayCircleOutlineOutlinedIcon />} color="#1565C0" accent />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Not Started" value={summary.not_started} icon={<ScheduleOutlinedIcon />} color="#546E7A" accent />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Overall Progress</Typography>
            <Chip
              icon={<AssignmentTurnedInOutlinedIcon />}
              label={`${summary.completion_percentage}% complete`}
              color={summary.completion_percentage >= 100 ? 'success' : 'primary'}
              variant="outlined"
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={summary.completion_percentage}
            color={summary.completion_percentage >= 100 ? 'success' : 'primary'}
            sx={{ height: 10, borderRadius: 3 }}
          />
          <Stack direction="row" spacing={3} sx={{ pt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Total assigned: {summary.total_assignments}
            </Typography>
            {summary.overdue > 0 && (
              <Typography variant="caption" color="error">
                Overdue: {summary.overdue}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid #E3E8EF' }}>
          <Typography variant="h6">Assigned Training Modules</Typography>
        </Box>
        {assignments.length === 0 ? (
          <EmptyState
            title="No training assigned yet"
            hint="Assign Training Modules to this New Joiner from the Assign Training screen"
          />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Training Module</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ width: 180 }}>Progress</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Completed On</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{assignment.training_module_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignment.training_module_duration_minutes} min
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={CONTENT_TYPE_LABELS[assignment.training_module_content_type as keyof typeof CONTENT_TYPE_LABELS] ?? assignment.training_module_content_type}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={assignment.status} />
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={assignment.progress} colorByStatus={assignment.status} />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{formatDate(assignment.due_date)}</Typography>
                        {assignment.overdue && <Typography variant="caption" color="error">Overdue</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(assignment.completed_date)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        title="Unassign"
                        onClick={() => setDeleteTarget(assignment)}
                        disabled={assignment.status === 'completed'}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Unassign Training Module</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Remove “{deleteTarget?.training_module_name}” from{' '}
            <strong>{joiner?.name}</strong>? Their progress on this module will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Unassign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}