import { useCallback, useEffect, useState, type FormEvent } from 'react'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { adminApi, masterApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { EmptyState, ErrorBanner, LoadingIndicator, PageHeader } from '../../components/ui'
import type { Team, Tower } from '../../types'

interface EntityDialogState {
  mode: 'tower' | 'team'
  entity?: Tower | Team | null
}

export default function OrgSettingsPage() {
  const [towers, setTowers] = useState<Tower[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [towerFilter, setTowerFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<EntityDialogState | null>(null)

  const loadTowers = useCallback(async () => {
    const data = await masterApi.towers()
    setTowers(data)
  }, [])

  const loadTeams = useCallback(async (towerId?: string) => {
    const data = await masterApi.teams(towerId || undefined)
    setTeams(data)
  }, [])

  useEffect(() => {
    Promise.all([loadTowers(), loadTeams()])
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [loadTowers, loadTeams])

  const handleFilter = (towerId: string) => {
    setTowerFilter(towerId)
    loadTeams(towerId || undefined).catch((err) => setError(getErrorMessage(err)))
  }

  const openAdd = (mode: 'tower' | 'team') => setDialog({ mode })
  const openEdit = (mode: 'tower' | 'team', entity: Tower | Team) => setDialog({ mode, entity })
  const close = () => setDialog(null)

  const saved = async (mode: 'tower' | 'team', towerId?: string) => {
    setDialog(null)
    setError(null)
    await loadTowers()
    await loadTeams(mode === 'team' && towerId ? towerId : towerFilter || undefined)
  }

  return (
    <Box>
      <PageHeader
        title="Towers & Teams"
        subtitle="Maintain the client tower and team structure used across portals"
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingIndicator />
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Towers</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => openAdd('tower')} variant="outlined">
                    Add Tower
                  </Button>
                </Stack>
                {towers.length === 0 ? (
                  <EmptyState title="No towers yet" hint="Add a tower to get started" />
                ) : (
                  <List disablePadding>
                    {towers.map((tower) => (
                      <ListItem
                        key={tower.id}
                        secondaryAction={
                          <IconButton edge="end" onClick={() => openEdit('tower', tower)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        }
                        disableGutters
                        divider
                      >
                        <ListItemText
                          primary={tower.name}
                          secondary={tower.description ?? '—'}
                          slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Teams</Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      select
                      size="small"
                      label="Tower"
                      value={towerFilter}
                      onChange={(e) => handleFilter(e.target.value)}
                      sx={{ minWidth: 180 }}
                    >
                      <MenuItem value="">All towers</MenuItem>
                      {towers.map((tower) => (
                        <MenuItem key={tower.id} value={tower.id}>
                          {tower.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => openAdd('team')} variant="outlined">
                      Add Team
                    </Button>
                  </Stack>
                </Stack>
                {teams.length === 0 ? (
                  <EmptyState title="No teams found" hint="Add a team or change the tower filter" icon={<ApartmentOutlinedIcon />} />
                ) : (
                  <List disablePadding>
                    {teams.map((team) => (
                      <ListItem
                        key={team.id}
                        secondaryAction={
                          <IconButton edge="end" onClick={() => openEdit('team', team)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        }
                        disableGutters
                        divider
                      >
                        <ListItemText
                          primary={team.name}
                          secondary={team.tower_name}
                          slotProps={{ primary: { sx: { fontWeight: 600 } }, secondary: { sx: { fontSize: '0.75rem' } } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <EntityFormDialog
        mode={dialog?.mode ?? 'tower'}
        entity={dialog?.entity ?? null}
        towers={towers}
        open={Boolean(dialog)}
        onClose={close}
        onSaved={saved}
      />
    </Box>
  )
}

function EntityFormDialog({
  mode,
  entity,
  towers,
  open,
  onClose,
  onSaved,
}: {
  mode: 'tower' | 'team'
  entity: Tower | Team | null
  towers: Tower[]
  open: boolean
  onClose: () => void
  onSaved: (mode: 'tower' | 'team', towerId?: string) => void
}) {
  const isEdit = Boolean(entity)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [towerId, setTowerId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setName(entity?.name ?? '')
    setDescription(entity?.description ?? '')
    setTowerId(entity && 'tower_id' in entity ? entity.tower_id : '')
  }, [open, entity])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (mode === 'tower') {
        if (isEdit) await adminApi.updateTower(entity!.id, { name, description: description || undefined })
        else await adminApi.createTower({ name, description: description || undefined })
        onSaved('tower')
      } else {
        if (isEdit) {
          await adminApi.updateTeam(entity!.id, { name, description: description || undefined })
          onSaved('team', 'tower_id' in (entity as Team) ? (entity as Team).tower_id : undefined)
        } else {
          await adminApi.createTeam({ name, tower_id: towerId, description: description || undefined })
          onSaved('team', towerId)
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const title = `${isEdit ? 'Edit' : 'Add'} ${mode === 'tower' ? 'Tower' : 'Team'}`

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {mode === 'team' && !isEdit && (
              <TextField
                select
                label="Tower"
                required
                fullWidth
                value={towerId}
                onChange={(e) => setTowerId(e.target.value)}
              >
                {towers.map((tower) => (
                  <MenuItem key={tower.id} value={tower.id}>
                    {tower.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Name"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Description (optional)"
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}