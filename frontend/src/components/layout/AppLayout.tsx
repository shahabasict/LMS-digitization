import { useState, type ReactNode } from 'react'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { Role } from '../../types'

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Managers', path: '/admin/managers', icon: <GroupOutlinedIcon /> },
    { label: 'Towers & Teams', path: '/admin/org', icon: <ApartmentOutlinedIcon /> },
  ],
  manager: [
    { label: 'Dashboard', path: '/manager', icon: <SpaceDashboardOutlinedIcon /> },
    { label: 'New Joiners', path: '/manager/joiners', icon: <PersonAddAltOutlinedIcon /> },
    { label: 'Training Modules', path: '/manager/modules', icon: <SchoolOutlinedIcon /> },
    { label: 'Assign Training', path: '/manager/assignments', icon: <AssignmentTurnedInOutlinedIcon /> },
    { label: 'Feedback', path: '/manager/feedback', icon: <RateReviewOutlinedIcon /> },
    { label: 'Reports', path: '/manager/reports', icon: <AssessmentOutlinedIcon /> },
  ],
  new_joiner: [
    { label: 'My Dashboard', path: '/join', icon: <SpaceDashboardOutlinedIcon /> },
    { label: 'My Training', path: '/join/training', icon: <SchoolOutlinedIcon /> },
  ],
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  new_joiner: 'New Joiner',
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const items = NAV_ITEMS[user.role] ?? []
  const currentPath = window.location.pathname

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const sidebar = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: '1px solid #E3E8EF' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark', lineHeight: 1.3 }}>
          Welcome Training
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Portal
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1, px: 1.5, py: 1 }}>
        {items.map((item) => {
          const selected = currentPath.startsWith(item.path)
          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
              selected={selected}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { backgroundColor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
      </List>
      <Box sx={{ p: 1.5, borderTop: '1px solid #E3E8EF' }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            color="inherit"
            aria-label="open menu"
            edge="start"
            sx={{ mr: 1, display: { md: 'none' } }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuOutlinedIcon />
          </IconButton>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.16)',
            }}
          >
            <SchoolOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Welcome Training Portal
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.22)', fontSize: 14 }}>
            {user.name.trim().charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {user.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85, lineHeight: 1.2 }}>
              {ROLE_LABELS[user.role]}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: 260 }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 260 } }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: 260, boxSizing: 'border-box', borderRight: '1px solid #E3E8EF' },
          }}
        >
          {sidebar}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3.5 },
          mt: '64px',
          width: '100%',
          maxWidth: '1440px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}