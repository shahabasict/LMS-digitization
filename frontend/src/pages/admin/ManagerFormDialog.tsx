import { useEffect, useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import { adminApi, masterApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import type { Team, Tower, User } from '../../types'

export interface ManagerFormValues {
  name: string
  username: string
  email: string
  employee_id: string
  tower_id: string
  team_ids: string[]
  password: string
}

interface Props {
  open: boolean
  manager?: User | null
  onClose: () => void
  onSaved: () => void
}

export default function ManagerFormDialog({ open, manager, onClose, onSaved }: Props) {
  const isEdit = Boolean(manager)
  const [towers, setTowers] = useState<Tower[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [values, setValues] = useState<ManagerFormValues>({
    name: '',
    username: '',
    email: '',
    employee_id: '',
    tower_id: '',
    team_ids: [],
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setValues({
      name: manager?.name ?? '',
      username: manager?.username ?? '',
      email: manager?.email ?? '',
      employee_id: manager?.employee_id ?? '',
      tower_id: manager?.tower_id ?? '',
      team_ids: manager?.team_ids ?? [],
      password: '',
    })
    masterApi.towers().then(setTowers).catch(() => undefined)
  }, [open, manager])

  useEffect(() => {
    if (values.tower_id) {
      masterApi.teams(values.tower_id).then(setTeams).catch(() => undefined)
    } else {
      setTeams([])
    }
  }, [values.tower_id])

  const set = <K extends keyof ManagerFormValues>(key: K, value: ManagerFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        name: values.name,
        username: values.username,
        email: values.email || undefined,
        employee_id: values.employee_id || undefined,
        tower_id: values.tower_id,
        team_ids: values.team_ids,
        ...(values.password ? { password: values.password } : {}),
      }
      if (isEdit && manager) {
        await adminApi.updateManager(manager.id, payload)
      } else {
        await adminApi.createManager(payload)
      }
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit Manager' : 'Enroll New Manager'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Full Name"
              required
              fullWidth
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
            />
            <TextField
              label="Username"
              required
              fullWidth
              disabled={isEdit}
              helperText={isEdit ? 'Username cannot be changed after creation' : undefined}
              value={values.username}
              onChange={(e) => set('username', e.target.value)}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Email"
                fullWidth
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
              />
              <TextField
                label="Employee ID"
                fullWidth
                value={values.employee_id}
                onChange={(e) => set('employee_id', e.target.value)}
              />
            </Box>
            <TextField
              select
              label="Tower"
              required
              fullWidth
              value={values.tower_id}
              onChange={(e) => set('tower_id', e.target.value)}
            >
              {towers.map((tower) => (
                <MenuItem key={tower.id} value={tower.id}>
                  {tower.name}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              multiple
              options={teams}
              getOptionLabel={(team) => team.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={teams.filter((team) => values.team_ids.includes(team.id))}
              onChange={(_, selected) => set('team_ids', selected.map((t) => t.id))}
              disabled={!values.tower_id || teams.length === 0}
              renderInput={(params) => (
                <TextField {...params} label="Permitted Teams" helperText="Empty means all teams in the tower" />
              )}
            />
            <TextField
              label={isEdit ? 'New Password (optional)' : 'Temporary Password'}
              type="password"
              fullWidth
              required={!isEdit}
              helperText={isEdit ? 'Leave blank to keep the current password' : 'Minimum 8 characters'}
              value={values.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={18} /> : isEdit ? 'Save Changes' : 'Create Manager'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}