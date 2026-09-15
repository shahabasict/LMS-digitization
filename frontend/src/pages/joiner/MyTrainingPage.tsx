import { useCallback, useEffect, useState } from 'react'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Rating from '@mui/material/Rating'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { meApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { CONTENT_TYPE_LABELS, EmptyState, ErrorBanner, LoadingIndicator, PageHeader, StatusChip, formatDate } from '../../components/ui'
import type { TrainingAssignment } from '../../types'

export default function MyTrainingPage() {
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [feedbackTarget, setFeedbackTarget] = useState<TrainingAssignment | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    meApi
      .assignments()
      .then(setAssignments)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (assignment: TrainingAssignment, status: 'in_progress' | 'completed') => {
    setError(null)
    try {
      await meApi.setStatus(assignment.id, status)
      if (status === 'completed') {
        setFeedbackTarget(await meApi.assignments().then((all) => all.find((a) => a.id === assignment.id) ?? assignment))
        setRating(0)
        setComment('')
      }
      setSuccess(status === 'completed' ? 'Training module marked as completed' : 'Started training course')
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const submitFeedback = async () => {
    if (!feedbackTarget || rating === 0) return
    setSubmitting(true)
    setError(null)
    try {
      await meApi.submitFeedback({
        training_module_id: feedbackTarget.training_module_id,
        rating,
        comment: comment || undefined,
      })
      setFeedbackTarget(null)
      setSuccess('Feedback submitted — thank you!')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      <PageHeader title="My Training" subtitle="Complete your assigned onboarding Training Modules" />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingIndicator />
      ) : assignments.length === 0 ? (
        <Card>
          <EmptyState title="No training assigned yet" hint="Once your Manager assigns Training Modules, they will appear here." />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {assignments.map((assignment) => {
            const isCompleted = assignment.status === 'completed'
            const isInProgress = assignment.status === 'in_progress'
            const canComplete = isInProgress || assignment.progress > 0
            return (
              <Grid size={{ xs: 12, md: 6 }} key={assignment.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 17 }} noWrap>
                          {assignment.training_module_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {CONTENT_TYPE_LABELS[assignment.training_module_content_type as keyof typeof CONTENT_TYPE_LABELS] ?? assignment.training_module_content_type}
                          {assignment.training_module_duration_minutes ? ` · ${assignment.training_module_duration_minutes} min` : ''}
                        </Typography>
                      </Box>
                      <StatusChip status={assignment.status} />
                    </Box>

                    <Box sx={{ mt: 2, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={assignment.progress}
                        color={isCompleted ? 'success' : 'primary'}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {assignment.progress}%
                      </Typography>
                    </Box>

                    <Typography variant="caption" color={assignment.overdue ? 'error' : 'text.secondary'}>
                      Due {formatDate(assignment.due_date)}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<LaunchOutlinedIcon />}
                        component="a"
                        href={assignment.training_module_content_url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Content
                      </Button>
                      {!isInProgress && !isCompleted && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PlayCircleOutlineOutlinedIcon />}
                          onClick={() => updateStatus(assignment, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      {canComplete && !isCompleted && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          startIcon={<CheckCircleOutlineOutlinedIcon />}
                          onClick={() => updateStatus(assignment, 'completed')}
                        >
                          Mark Complete
                        </Button>
                      )}
                      {isCompleted && (
                        <IconButton
                          size="small"
                          color="primary"
                          title="Submit feedback"
                          onClick={() => {
                            setFeedbackTarget(assignment)
                            setRating(0)
                            setComment('')
                          }}
                        >
                          <RateReviewOutlinedIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      <Dialog open={Boolean(feedbackTarget)} onClose={() => setFeedbackTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Rate this Training Module</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2">{feedbackTarget?.training_module_name}</Typography>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Your rating
              </Typography>
              <Rating value={rating} onChange={(_e, value) => setRating(value ?? 0)} size="large" />
            </Box>
            <TextField
              label="Comments (optional)"
              multiline
              minRows={3}
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFeedbackTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" disabled={rating === 0 || submitting} onClick={submitFeedback}>
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  )
}