import { useCallback, useEffect, useState } from 'react'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import StarOutlinedIcon from '@mui/icons-material/StarOutlined'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Rating from '@mui/material/Rating'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { managerApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorBanner, LoadingIndicator, PageHeader, formatDate } from '../../components/ui'
import type { Feedback, TrainingModule } from '../../types'

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [moduleFilter, setModuleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    (moduleId?: string) => {
      setLoading(true)
      setError(null)
      managerApi
        .feedback({ training_module_id: moduleId || undefined })
        .then(setFeedback)
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false))
    },
    [],
  )

  useEffect(() => {
    load()
    managerApi.modules({ status: 'active' }).then(setModules).catch(() => undefined)
  }, [load])

  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : '—'

  return (
    <Box>
      <PageHeader
        title="Training Feedback"
        subtitle="Feedback provided by New Joiners on their assigned Training Modules"
      />

      <Paper sx={{ mb: 2, p: 1.5 }}>
        <Toolbar disableGutters sx={{ gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Training Module"
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value)
              load(e.target.value)
            }}
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="">All modules</MenuItem>
            {modules.map((module) => (
              <MenuItem key={module.id} value={module.id}>
                {module.name}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {feedback.length} response{feedback.length === 1 ? '' : 's'} · Avg rating {avgRating}
            {avgRating !== '—' && ' / 5'}
          </Typography>
        </Toolbar>
      </Paper>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingIndicator />
      ) : feedback.length === 0 ? (
        <Paper>
          <EmptyState
            title="No feedback yet"
            hint="Feedback will appear here once New Joiners rate their assigned Training Modules"
            icon={<RateReviewOutlinedIcon />}
          />
        </Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>New Joiner</TableCell>
                  <TableCell>Training Module</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell>Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedback.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{f.new_joiner_name ?? '—'}</TableCell>
                    <TableCell>{f.training_module_name}</TableCell>
                    <TableCell>
                      <Rating value={f.rating} size="small" readOnly precision={1} emptyIcon={<StarOutlinedIcon fontSize="inherit" />} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 380 }}>
                      <Typography variant="body2" color="text.secondary">
                        {f.comment || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(f.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  )
}