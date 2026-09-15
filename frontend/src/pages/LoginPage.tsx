import { useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { homePathForRole, useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const loggedIn = await login(username, password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? homePathForRole(loggedIn.role), { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 55%, #1E88E5 100%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440, boxShadow: 8 }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={3} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'primary.main',
                color: 'white',
              }}
            >
              <SchoolOutlinedIcon sx={{ fontSize: 36 }} />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Welcome Training Portal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to access your onboarding workspace
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  label="Username / Employee ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  fullWidth
                  autoFocus
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LockOutlinedIcon />}
                  disabled={submitting}
                >
                  Sign In
                </Button>
              </Stack>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Managed portal for Admins, Managers and New Joiners
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}