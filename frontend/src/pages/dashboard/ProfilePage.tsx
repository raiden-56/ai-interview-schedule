import { useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  CameraAlt,
  Save,
  Lock,
  Person,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { userAPI } from "../../services/api";
import { updateUser } from "../../redux/slices/authSlice";

const roleColors: Record<string, "secondary" | "primary" | "warning"> = {
  RECRUITER: "secondary",
  CANDIDATE: "primary",
  ADMIN: "warning",
};

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Profile form
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) {
      setProfileMsg({
        type: "error",
        text: "Photo must be smaller than 300 KB",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileMsg({
        type: "error",
        text: "First and last name are required",
      });
      return;
    }
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const data = await userAPI.updateProfile({
        firstName,
        lastName,
        phone,
        avatar,
      });
      dispatch(updateUser(data.data));
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: "All password fields are required",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 8 characters",
      });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await userAPI.changePassword(currentPassword, newPassword);
      setPasswordMsg({
        type: "success",
        text: "Password changed successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          My Profile
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your account information and security
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left — Avatar card */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 4,
                }}
              >
                <Box sx={{ position: "relative", mb: 2 }}>
                  <Avatar
                    src={avatar || undefined}
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: "primary.main",
                      fontSize: 36,
                    }}
                  >
                    {!avatar && `${firstName?.[0] || ""}${lastName?.[0] || ""}`}
                  </Avatar>
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      bgcolor: "primary.main",
                      color: "white",
                      width: 32,
                      height: 32,
                      "&:hover": { bgcolor: "primary.dark" },
                    }}
                    size="small"
                  >
                    <CameraAlt sx={{ fontSize: 16 }} />
                  </IconButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  {firstName} {lastName}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  {user?.email}
                </Typography>
                <Chip
                  label={user?.role}
                  color={roleColors[user?.role || "CANDIDATE"]}
                  size="small"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  JPG, PNG — max 300 KB
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CameraAlt />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ mt: 1 }}
                >
                  Upload Photo
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Right — Forms */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Profile info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <Person sx={{ color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600}>
                      Personal Information
                    </Typography>
                  </Stack>

                  {profileMsg && (
                    <Alert severity={profileMsg.type} sx={{ mb: 2 }}>
                      {profileMsg.text}
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        value={user?.email || ""}
                        fullWidth
                        disabled
                        helperText="Email cannot be changed"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        fullWidth
                        placeholder="+1 234 567 8900"
                      />
                    </Grid>
                  </Grid>

                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      startIcon={
                        profileLoading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <Save />
                        )
                      }
                      onClick={handleSaveProfile}
                      disabled={profileLoading}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>

            {/* Change password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <Lock sx={{ color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600}>
                      Change Password
                    </Typography>
                  </Stack>

                  {passwordMsg && (
                    <Alert severity={passwordMsg.type} sx={{ mb: 2 }}>
                      {passwordMsg.text}
                    </Alert>
                  )}

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    <TextField
                      label="Current Password"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowCurrent((v) => !v)}
                            edge="end"
                          >
                            {showCurrent ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        ),
                      }}
                    />
                    <TextField
                      label="New Password"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      fullWidth
                      helperText="At least 8 characters"
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowNew((v) => !v)}
                            edge="end"
                          >
                            {showNew ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        ),
                      }}
                    />
                    <TextField
                      label="Confirm New Password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowConfirm((v) => !v)}
                            edge="end"
                          >
                            {showConfirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        ),
                      }}
                    />
                  </Stack>

                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={
                        passwordLoading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <Lock />
                        )
                      }
                      onClick={handleChangePassword}
                      disabled={passwordLoading}
                    >
                      Update Password
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
