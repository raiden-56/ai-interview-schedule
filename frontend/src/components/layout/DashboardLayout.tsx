import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  Badge,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  VideoCall,
  Code,
  Assessment,
  People,
  Settings,
  Notifications,
  DarkMode,
  LightMode,
  Logout,
  Person,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { logout } from "../../redux/slices/authSlice";
import { toggleTheme } from "../../redux/slices/themeSlice";

const DRAWER_WIDTH = 260;

const recruiterMenuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
  { text: "Interviews", icon: <VideoCall />, path: "/dashboard/interviews" },
  { text: "Candidates", icon: <People />, path: "/dashboard/candidates" },
  { text: "Analytics", icon: <Assessment />, path: "/dashboard/analytics" },
  { text: "Profile", icon: <Person />, path: "/dashboard/profile" },
  { text: "Settings", icon: <Settings />, path: "/dashboard/settings" },
];

const candidateMenuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
  { text: "My Interviews", icon: <VideoCall />, path: "/dashboard/interviews" },
  { text: "Code Practice", icon: <Code />, path: "/dashboard/practice" },
  { text: "AI Feedback", icon: <Assessment />, path: "/dashboard/feedback" },
  { text: "Profile", icon: <Person />, path: "/dashboard/profile" },
  { text: "Settings", icon: <Settings />, path: "/dashboard/settings" },
];

const adminMenuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
  { text: "Users", icon: <People />, path: "/dashboard/users" },
  { text: "Interviews", icon: <VideoCall />, path: "/dashboard/interviews" },
  { text: "Analytics", icon: <Assessment />, path: "/dashboard/analytics" },
  { text: "Settings", icon: <Settings />, path: "/dashboard/settings" },
];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);

  const menuItems =
    user?.role === "ADMIN"
      ? adminMenuItems
      : user?.role === "RECRUITER"
        ? recruiterMenuItems
        : candidateMenuItems;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <Code sx={{ color: "primary.main", fontSize: 32 }} />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          InterviewAI
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "rgba(124, 77, 255, 0.1)" }} />
      <List sx={{ flex: 1, px: 2, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                "&.Mui-selected": {
                  backgroundColor: "rgba(124, 77, 255, 0.15)",
                  "&:hover": { backgroundColor: "rgba(124, 77, 255, 0.25)" },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? "primary.main"
                      : "text.secondary",
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ borderColor: "rgba(124, 77, 255, 0.1)" }} />
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "background.default",
          }}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <IconButton onClick={() => dispatch(toggleTheme())} sx={{ mr: 1 }}>
              {mode === "dark" ? <LightMode /> : <DarkMode />}
            </IconButton>
            <IconButton sx={{ mr: 1 }}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                {user?.firstName?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate("/dashboard/profile");
                }}
              >
                <Person sx={{ mr: 1 }} /> Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, p: 3, overflow: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
