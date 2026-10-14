import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import { getProfile } from "../../redux/slices/authSlice";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();

  // Login only returns basic user fields; load the full profile (company etc.)
  // once. The profile always contains the `companyMember` key (possibly null),
  // so checking for the key avoids refetching forever for candidates.
  const needsProfile = isAuthenticated && !!user && !("companyMember" in user);
  useEffect(() => {
    if (needsProfile) dispatch(getProfile());
  }, [needsProfile, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
