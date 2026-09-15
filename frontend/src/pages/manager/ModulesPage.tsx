import { useCallback, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { managerApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { CONTENT_TYPE_LABELS, EmptyState, ErrorBanner, LoadingIndicator, PageHeader, StatusChip } from '../../components/ui'
import type { TrainingModule } from '../../types'
import ModuleFormDialog from './ModuleFormDialog'

export default function ModulesPage() {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingModule | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await managerApi.modules({
        search: search || undefined,
        content_type: typeFilter || undefined,
        status: statusFilter || undefined,
      })
      setModules(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const toggleStatus = async (module: TrainingModule) => {
    const next = module.status === 'active' ? 'inactive' : 'active'
    await managerApi.setModuleStatus(module.id, next)
    load()
  }

  return (
    <Box>
      <PageHeader
        title="Training Modules"
        subtitle="Create and maintain the onboarding Training Modules library"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            Create Module
          </Button>
        }
      />

      <Paper sx={{ mb: 2, p: 1.5 }}>
        <Toolbar disableGutters sx={{ gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search modules"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
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
            label="Content Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All types</MenuItem>
            {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {modules.length} module{modules.length === 1 ? '' : 's'}
          </Typography>
        </Toolbar>
      </Paper>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingIndicator />
      ) : modules.length === 0 ? (
        <Paper>
          <EmptyState title="No Training Modules found" hint="Create a Training Module to add it to the library" />
        </Paper>
      ) : (
        <Paper>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Applicability</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map((module) => {
                  const scopeLabel =
                    !module.tower_ids.length
                      ? 'All towers'
                      : module.team_ids.length
                        ? module.team_names.join(', ')
                        : module.tower_names.join(', ')
                  return (
                    <TableRow key={module.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{module.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {module.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" label={CONTENT_TYPE_LABELS[module.content_type]} />
                      </TableCell>
                      <TableCell>{module.duration_minutes} min</TableCell>
                      <TableCell>
                        <Chip size="small" label={scopeLabel} variant="outlined" color={module.tower_ids.length ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={module.status} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          title="Open content"
                          component="a"
                          href={module.content_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <LaunchOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          title="Edit"
                          onClick={() => {
                            setEditing(module)
                            setDialogOpen(true)
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          title={module.status === 'active' ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleStatus(module)}
                        >
                          {module.status === 'active' ? (
                            <BlockOutlinedIcon fontSize="small" color="error" />
                          ) : (
                            <CheckCircleOutlineOutlinedIcon fontSize="small" color="success" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      <ModuleFormDialog
        open={dialogOpen}
        module={editing}
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