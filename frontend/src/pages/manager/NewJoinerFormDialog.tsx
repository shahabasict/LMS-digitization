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
import { managerApi, masterApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import type { Team, Tower, User } from '../../types'

export interface NewJoinerFormValues {
  name: string
  username: string
  employee_id: string
  email: string
  tower_id: string
  team_id: string
  joining_date: string
  password: string
}

interface Props {
  open: boolean
  joiner?: User | null
  onClose: () => void
  onSaved: () => void
}

export default function NewJoinerFormDialog({ open, joiner, onClose, onSaved }: Props) {
  const isEdit = Boolean(joiner)
  const { user: currentUser } = useAuth()
  const [towers, setTowers] = useState<Tower[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [values, setValues] = useState<NewJoinerFormValues>({
    name: '',
    username: '',
    employee_id: '',
    email: '',
    tower_id: '',
    team_id: '',
    joining_date: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setValues({
      name: joiner?.name ?? '',
      username: joiner?.username ?? '',
      employee_id: joiner?.employee_id ?? '',
      email: joiner?.email ?? '',
      tower_id: joiner?.tower_id ?? currentUser?.tower_id ?? '',
      team_id: joiner?.team_id ?? '',
      joining_date: joiner?.joining_date ? joiner.joining_date.slice(0, 10) : '',
      password: '',
    })
    masterApi.towers().then(setTowers).catch(() => undefined)
  }, [open, joiner, currentUser])

  useEffect(() => {
    if (!values.tower_id) {
      setTeams([])
      return
    }
    masterApi
      .teams(values.tower_id)
      .then((allTeams) => {
        const permitted = currentUser?.team_ids?.length
          ? allTeams.filter((team) => currentUser.team_ids.includes(team.id))
          : allTeams
        setTeams(permitted)
      })
      .catch(() => undefined)
  }, [values.tower_id, currentUser])

  const set = <K extends keyof NewJoinerFormValues>(key: K, value: NewJoinerFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        name: values.name,
        username: values.username,
        employee_id: values.employee_id || undefined,
        email: values.email || undefined,
        tower_id: values.tower_id,
        team_id: values.team_id,
        joining_date: values.joining_date || null,
        ...(values.password ? { password: values.password } : {}),
      }
      if (isEdit && joiner) {
        await managerApi.updateJoiner(joiner.id, payload)
      } else {
        await managerApi.createJoiner(payload)
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
        <DialogTitle>{isEdit ? 'Edit New Joiner' : 'Enroll New Joiner'}</DialogTitle>
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Username"
                required
                fullWidth
                disabled={isEdit}
                helperText={isEdit ? 'Cannot be changed after creation' : undefined}
                value={values.username}
                onChange={(e) => set('username', e.target.value)}
              />
              <TextField
                label="Employee ID"
                fullWidth
                value={values.employee_id}
                onChange={(e) => set('employee_id', e.target.value)}
              />
            </Box>
            <TextField
              label="Email"
              fullWidth
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                label="Tower"
                required
                fullWidth
                disabled
                helperText="Restricted to your tower"
                value={values.tower_id}
                onChange={(e) => {
                  set('tower_id', e.target.value)
                  set('team_id', '')
                }}
              >
                {towers.map((tower) => (
                  <MenuItem key={tower.id} value={tower.id}>
                    {tower.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Team"
                required
                fullWidth
                value={values.team_id}
                onChange={(e) => set('team_id', e.target.value)}
              >
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Joining Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={values.joining_date}
              onChange={(e) => set('joining_date', e.target.value)}
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
            {saving ? <CircularProgress size={18} /> : isEdit ? 'Save Changes' : 'Enroll New Joiner'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}