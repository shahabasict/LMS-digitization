import { useEffect, useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { managerApi, masterApi } from '../../api'
import { getErrorMessage } from '../../api/client'
import { CONTENT_TYPE_LABELS } from '../../components/ui'
import type { Team, Tower, TrainingModule } from '../../types'

export interface ModuleFormValues {
  name: string
  description: string
  content_type: string
  content_url: string
  duration_minutes: string
  tower_ids: string[]
  team_ids: string[]
}

interface Props {
  open: boolean
  module?: TrainingModule | null
  onClose: () => void
  onSaved: () => void
}

export default function ModuleFormDialog({ open, module, onClose, onSaved }: Props) {
  const isEdit = Boolean(module)
  const [values, setValues] = useState<ModuleFormValues>({
    name: '',
    description: '',
    content_type: 'pdf',
    content_url: '',
    duration_minutes: '30',
    tower_ids: [],
    team_ids: [],
  })
  const [towers, setTowers] = useState<Tower[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [applicableAll, setApplicableAll] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setValues({
      name: module?.name ?? '',
      description: module?.description ?? '',
      content_type: module?.content_type ?? 'pdf',
      content_url: module?.content_url ?? '',
      duration_minutes: String(module?.duration_minutes ?? 30),
      tower_ids: module?.tower_ids ?? [],
      team_ids: module?.team_ids ?? [],
    })
    setApplicableAll(!module || (!module.tower_ids.length && !module.team_ids.length))
    masterApi.towers().then(setTowers).catch(() => undefined)
  }, [open, module])

  useEffect(() => {
    if (values.tower_ids.length) {
      Promise.all(values.tower_ids.map((id) => masterApi.teams(id)))
        .then((groups) => setTeams(groups.flat()))
        .catch(() => undefined)
    } else {
      setTeams([])
    }
  }, [values.tower_ids])

  const set = <K extends keyof ModuleFormValues>(key: K, value: ModuleFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const toggleTower = (id: string) => {
    const has = values.tower_ids.includes(id)
    set('tower_ids', has ? values.tower_ids.filter((x) => x !== id) : [...values.tower_ids, id])
  }

  const toggleTeam = (id: string) => {
    const has = values.team_ids.includes(id)
    set('team_ids', has ? values.team_ids.filter((x) => x !== id) : [...values.team_ids, id])
  }

  const handleApplicableToggle = () => {
    const next = !applicableAll
    setApplicableAll(next)
    if (next) {
      set('tower_ids', [])
      set('team_ids', [])
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        content_type: values.content_type,
        content_url: values.content_url,
        duration_minutes: Number(values.duration_minutes) || 0,
        tower_ids: applicableAll ? [] : values.tower_ids,
        team_ids: applicableAll ? [] : values.team_ids,
      }
      if (isEdit && module) {
        await managerApi.updateModule(module.id, payload)
      } else {
        await managerApi.createModule(payload)
      }
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit Training Module' : 'Create Training Module'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Training Module Name"
              required
              fullWidth
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                label="Content Type"
                required
                value={values.content_type}
                onChange={(e) => set('content_type', e.target.value)}
              >
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Duration (minutes)"
                type="number"
                required
                value={values.duration_minutes}
                onChange={(e) => set('duration_minutes', e.target.value)}
              />
            </Box>
            <TextField
              label="Content Link / Path"
              required
              fullWidth
              helperText="PDF path, internal link, external URL or Percipio course link"
              placeholder={values.content_type === 'percipio' ? 'https://percipio.example.com/course' : 'https://… or /content/…'}
              value={values.content_url}
              onChange={(e) => set('content_url', e.target.value)}
            />
            <FormControlLabel
              control={<Checkbox checked={applicableAll} onChange={handleApplicableToggle} />}
              label="Applicable to all towers and teams"
            />
            {!applicableAll && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Tower applicability
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {towers.map((tower) => (
                    <FormControlLabel
                      key={tower.id}
                      control={
                        <Checkbox
                          checked={values.tower_ids.includes(tower.id)}
                          onChange={() => toggleTower(tower.id)}
                          size="small"
                        />
                      }
                      label={tower.name}
                    />
                  ))}
                </Stack>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Team applicability (optional)
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {teams.map((team) => (
                    <FormControlLabel
                      key={team.id}
                      control={
                        <Checkbox
                          checked={values.team_ids.includes(team.id)}
                          onChange={() => toggleTeam(team.id)}
                          size="small"
                        />
                      }
                      label={team.name}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={18} /> : isEdit ? 'Save Changes' : 'Create Module'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}