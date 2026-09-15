import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { homePathForRole, useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  if (user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Already signed in
        </Typography>
        <Button component={RouterLink} to={homePathForRole(user.role)} variant="contained">
          Continue to Dashboard
        </Button>
      </Box>
    )
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
      <Card sx={{ width: '100%', maxWidth: 520, boxShadow: 8 }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
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
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Welcome Training Portal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
              A centralized onboarding workspace for Release Management — Managers create and
              assign Training Modules, a New Joiner tracks progress, and Admins manage the
              organization structure.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <Button component={RouterLink} to="/login" variant="contained" size="large">
                Sign In
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}