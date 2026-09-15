import { useCallback, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableFooter from '@mui/material/TableFooter'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { adminApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorBanner, LoadingIndicator, PageHeader, StatusChip, formatDate } from '../../components/ui'
import type { User } from '../../types'
import ManagerFormDialog from './ManagerFormDialog'

const PAGE_SIZE = 10

export default function ManagersPage() {
  const [managers, setManagers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [viewing, setViewing] = useState<User | null>(null)
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.managers({
        search: search || undefined,
        status: statusFilter || undefined,
      })
      setManagers(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const toggleStatus = async (manager: User) => {
    const next = manager.status === 'active' ? 'inactive' : 'active'
    await adminApi.setManagerStatus(manager.id, next)
    load()
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (manager: User) => {
    setEditing(manager)
    setDialogOpen(true)
  }

  const handleSaved = () => {
    setDialogOpen(false)
    load()
  }

  const visible = managers.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <Box>
      <PageHeader
        title="Manager Management"
        subtitle="Enroll and manage Manager accounts for your client environment"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Enroll Manager
          </Button>
        }
      />

      <Paper sx={{ mb: 2, p: 1.5 }}>
        <Toolbar disableGutters sx={{ gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by name or username"
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
            {managers.length} manager{managers.length === 1 ? '' : 's'}
          </Typography>
        </Toolbar>
      </Paper>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingIndicator />
      ) : managers.length === 0 ? (
        <Paper>
          <EmptyState title="No Managers found" hint="Enroll a manager to get started" />
        </Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Tower</TableCell>
                  <TableCell>Teams</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((manager) => (
                  <TableRow key={manager.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{manager.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {manager.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{manager.username}</TableCell>
                    <TableCell>{manager.tower_name ?? '—'}</TableCell>
                    <TableCell>
                      {manager.team_names.length > 0 ? (
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {manager.team_names.map((name) => (
                            <Chip key={name} size="small" variant="outlined" label={name} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          All teams
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={manager.status} />
                    </TableCell>
                    <TableCell>{formatDate(manager.created_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton title="View details" onClick={() => setViewing(manager)}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton title="Edit" onClick={() => openEdit(manager)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        title={manager.status === 'active' ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleStatus(manager)}
                      >
                        {manager.status === 'active' ? (
                          <BlockOutlinedIcon fontSize="small" color="error" />
                        ) : (
                          <CheckCircleOutlineOutlinedIcon fontSize="small" color="success" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {managers.length > PAGE_SIZE && (
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      count={managers.length}
                      page={page}
                      onPageChange={(_, next) => setPage(next)}
                      rowsPerPage={PAGE_SIZE}
                      rowsPerPageOptions={[PAGE_SIZE]}
                    />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        </Paper>
      )}

      <ManagerFormDialog
        open={dialogOpen}
        manager={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />

      <ManagerViewDialog manager={viewing} onClose={() => setViewing(null)} />
    </Box>
  )
}

function ManagerViewDialog({ manager, onClose }: { manager: User | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(manager)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manager Details</DialogTitle>
      <DialogContent dividers>
        {manager && (
          <Stack spacing={1.5}>
            <DetailRow label="Full Name" value={manager.name} />
            <DetailRow label="Username" value={manager.username} />
            <DetailRow label="Email" value={manager.email ?? '—'} />
            <DetailRow label="Employee ID" value={manager.employee_id ?? '—'} />
            <DetailRow label="Tower" value={manager.tower_name ?? '—'} />
            <DetailRow
              label="Teams"
              value={manager.team_names.length ? manager.team_names.join(', ') : 'All teams in tower'}
            />
            <DetailRow label="Status" value={<StatusChip status={manager.status} />} />
            <DetailRow label="Created" value={formatDate(manager.created_at)} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  )
}