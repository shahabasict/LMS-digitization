import { useCallback, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useNavigate } from 'react-router-dom'
import { managerApi, masterApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorBanner, LoadingIndicator, PageHeader, StatusChip, formatDate } from '../../components/ui'
import type { Team, User } from '../../types'
import NewJoinerFormDialog from './NewJoinerFormDialog'

const PAGE_SIZE = 10

export default function JoinersPage() {
  const navigate = useNavigate()
  const [joiners, setJoiners] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await managerApi.joiners({
        search: search || undefined,
        status: statusFilter || undefined,
        team_id: teamFilter || undefined,
      })
      setJoiners(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, teamFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    masterApi.teams().then(setTeams).catch(() => undefined)
  }, [])

  const toggleStatus = async (joiner: User) => {
    const next = joiner.status === 'active' ? 'inactive' : 'active'
    await managerApi.setJoinerStatus(joiner.id, next)
    load()
  }

  const visible = joiners.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <Box>
      <PageHeader
        title="New Joiners"
        subtitle="Enroll and manage New Joiners within your tower and teams"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            Enroll New Joiner
          </Button>
        }
      />

      <Paper sx={{ mb: 2, p: 1.5 }}>
        <Toolbar disableGutters sx={{ gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search name, username or employee ID"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            sx={{ minWidth: 280 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="Team"
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value)
              setPage(0)
            }}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">All teams</MenuItem>
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {joiners.length} New Joiner{joiners.length === 1 ? '' : 's'}
          </Typography>
        </Toolbar>
      </Paper>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingIndicator />
      ) : joiners.length === 0 ? (
        <Paper>
          <EmptyState title="No New Joiners found" hint="Enroll a New Joiner to begin tracking their training" />
        </Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>New Joiner</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Joining Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((joiner) => (
                  <TableRow key={joiner.id} hover onClick={() => navigate(`/manager/joiners/${joiner.id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{joiner.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        @{joiner.username}
                      </Typography>
                    </TableCell>
                    <TableCell>{joiner.employee_id ?? '—'}</TableCell>
                    <TableCell>{joiner.team_name ?? '—'}</TableCell>
                    <TableCell>{formatDate(joiner.joining_date)}</TableCell>
                    <TableCell>
                      <StatusChip status={joiner.status} />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <IconButton title="View progress" onClick={() => navigate(`/manager/joiners/${joiner.id}`)}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton title="Edit" onClick={() => {
                        setEditing(joiner)
                        setDialogOpen(true)
                      }}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        title={joiner.status === 'active' ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleStatus(joiner)}
                      >
                        {joiner.status === 'active' ? (
                          <BlockOutlinedIcon fontSize="small" color="error" />
                        ) : (
                          <CheckCircleOutlineOutlinedIcon fontSize="small" color="success" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {joiners.length > PAGE_SIZE && (
                <TableRow>
                  <TablePagination
                    count={joiners.length}
                    page={page}
                    onPageChange={(_, next) => setPage(next)}
                    rowsPerPage={PAGE_SIZE}
                    rowsPerPageOptions={[PAGE_SIZE]}
                  />
                </TableRow>
              )}
            </Table>
          </TableContainer>
        </Paper>
      )}

      <NewJoinerFormDialog
        open={dialogOpen}
        joiner={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false)
          setEditing(null)
          load()
        }}
      />
    </Box>
  )
}