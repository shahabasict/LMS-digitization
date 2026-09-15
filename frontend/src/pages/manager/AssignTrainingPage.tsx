import { useCallback, useEffect, useState } from 'react'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import Alert from '@mui/material/Alert'
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
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Snackbar from '@mui/material/Snackbar'
import { managerApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { ErrorBanner, PageHeader, ProgressBar, StatusChip, formatDate } from '../../components/ui'
import type { TrainingAssignment, TrainingModule, User } from '../../types'

export default function AssignTrainingPage() {
  const [joiners, setJoiners] = useState<User[]>([])
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([])
  const [selectedJoiners, setSelectedJoiners] = useState<string[]>([])
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TrainingAssignment | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [joined, mods, assigned] = await Promise.all([
        managerApi.joiners(),
        managerApi.modules({ status: 'active' }),
        managerApi.assignments(),
      ])
      setJoiners(joined)
      setModules(mods)
      setAssignments(assigned)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleSelect = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  const submit = async () => {
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const created = await managerApi.createAssignments({
        new_joiner_ids: selectedJoiners,
        training_module_ids: selectedModules,
        due_date: dueDate || null,
      })
      setSuccess(`${created.length} assignment${created.length === 1 ? '' : 's'} created`)
      setSelectedJoiners([])
      setSelectedModules([])
      setDueDate('')
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await managerApi.deleteAssignment(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <Box>
      <PageHeader
        title="Assign Training"
        subtitle="Assign one or more Training Modules to New Joiners in your teams"
      />

      {error && <ErrorBanner message={error} />}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select New Joiners ({selectedJoiners.length} selected)
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 280, overflow: 'auto', p: 1 }}>
                <Stack spacing={0.5}>
                  {joiners.map((joiner) => (
                    <Box
                      key={joiner.id}
                      onClick={() => toggleSelect(selectedJoiners, setSelectedJoiners, joiner.id)}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        bgcolor: selectedJoiners.includes(joiner.id) ? 'primary.main' : 'transparent',
                        color: selectedJoiners.includes(joiner.id) ? 'white' : 'text.primary',
                        '&:hover': { bgcolor: selectedJoiners.includes(joiner.id) ? 'primary.dark' : 'action.hover' },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {joiner.name}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {joiner.team_name ?? ''} · {joiner.employee_id ?? ''}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Training Modules ({selectedModules.length} selected)
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 280, overflow: 'auto', p: 1 }}>
                <Stack spacing={0.5}>
                  {modules.map((module) => (
                    <Box
                      key={module.id}
                      onClick={() => toggleSelect(selectedModules, setSelectedModules, module.id)}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        bgcolor: selectedModules.includes(module.id) ? 'primary.main' : 'transparent',
                        color: selectedModules.includes(module.id) ? 'white' : 'text.primary',
                        '&:hover': { bgcolor: selectedModules.includes(module.id) ? 'primary.dark' : 'action.hover' },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {module.name}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {module.duration_minutes} min
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Due Date (optional)
              </Typography>
              <TextField
                type="date"
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <Button
                variant="contained"
                fullWidth
                startIcon={<AssignmentTurnedInOutlinedIcon />}
                disabled={selectedJoiners.length === 0 || selectedModules.length === 0 || submitting}
                onClick={submit}
                sx={{ mt: 1.5 }}
              >
                Assign
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid #E3E8EF', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6">Recent Assignments</Typography>
          <Chip size="small" label={`${assignments.length} total`} variant="outlined" />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>New Joiner</TableCell>
                <TableCell>Training Module</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ width: 160 }}>Progress</TableCell>
                <TableCell>Due</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.slice(0, 15).map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{assignment.new_joiner_name}</TableCell>
                  <TableCell>{assignment.training_module_name}</TableCell>
                  <TableCell>
                    <StatusChip status={assignment.status} />
                  </TableCell>
                  <TableCell>
                    <ProgressBar value={assignment.progress} colorByStatus={assignment.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(assignment.due_date)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      title="Unassign"
                      disabled={assignment.status === 'completed'}
                      onClick={() => setDeleteTarget(assignment)}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No assignments yet — select New Joiners and modules above
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Unassign Training Module</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Remove “{deleteTarget?.training_module_name}” from <strong>{deleteTarget?.new_joiner_name}</strong>?
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

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" icon={<CheckCircleOutlineOutlinedIcon />} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  )
}