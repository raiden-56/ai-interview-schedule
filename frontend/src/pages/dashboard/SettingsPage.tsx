import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from "@mui/material";
import { Palette, Notifications, Security, Info } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { toggleTheme } from "../../redux/slices/themeSlice";
import { logout } from "../../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { mode } = useAppSelector((state) => state.theme);
  const { user } = useAppSelector((state) => state.auth);

  const [notifications, setNotifications] = useState({
    emailInterviews: true,
    emailReminders: true,
    browserAlerts: false,
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const cardProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Settings
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Configure your preferences and account settings
        </Typography>
      </Box>

      <Stack spacing={3} maxWidth={720}>
        {/* Appearance */}
        <motion.div {...cardProps} transition={{ delay: 0 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Palette sx={{ color: "primary.main" }} />
                <Typography variant="h6" fontWeight={600}>
                  Appearance
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <List disablePadding>
                <ListItem disableGutters>
                  <ListItemText
                    primary="Dark Mode"
                    secondary={
                      mode === "dark"
                        ? "Currently using dark theme"
                        : "Currently using light theme"
                    }
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={mode === "dark"}
                      onChange={() => dispatch(toggleTheme())}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div {...cardProps} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Notifications sx={{ color: "primary.main" }} />
                <Typography variant="h6" fontWeight={600}>
                  Notifications
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <List disablePadding>
                <ListItem disableGutters>
                  <ListItemText
                    primary="Email — Interview Alerts"
                    secondary="Get notified when an interview is scheduled or updated"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.emailInterviews}
                      onChange={(e) =>
                        setNotifications((n) => ({
                          ...n,
                          emailInterviews: e.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText
                    primary="Email — Reminders"
                    secondary="Receive reminders 30 min before your interview"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.emailReminders}
                      onChange={(e) =>
                        setNotifications((n) => ({
                          ...n,
                          emailReminders: e.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText
                    primary="Browser Notifications"
                    secondary="Show desktop alerts for real-time events"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.browserAlerts}
                      onChange={(e) =>
                        setNotifications((n) => ({
                          ...n,
                          browserAlerts: e.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account info */}
        <motion.div {...cardProps} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Info sx={{ color: "primary.main" }} />
                <Typography variant="h6" fontWeight={600}>
                  Account
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Email</Typography>
                  <Typography fontWeight={500}>{user?.email}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Role</Typography>
                  <Chip label={user?.role} size="small" color="primary" />
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Name</Typography>
                  <Typography fontWeight={500}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                </Stack>
              </Stack>
              <Box mt={2}>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={() => navigate("/dashboard/profile")}
                >
                  Edit Profile →
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security / Danger zone */}
        <motion.div {...cardProps} transition={{ delay: 0.3 }}>
          <Card sx={{ border: "1px solid", borderColor: "error.main" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Security sx={{ color: "error.main" }} />
                <Typography variant="h6" fontWeight={600} color="error">
                  Security
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Alert severity="warning" sx={{ mb: 2 }}>
                To change your password, go to your Profile page.
              </Alert>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => navigate("/dashboard/profile")}
                >
                  Change Password
                </Button>
                <Button variant="outlined" color="error" onClick={handleLogout}>
                  Sign Out
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Stack>
    </Box>
  );
}
