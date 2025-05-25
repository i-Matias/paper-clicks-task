import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

export default function PrivateRoute({
  children,
}: {
  children: ReactElement;
  permission?: string;
}): ReactElement {
  const { isAuthenticated, isTokenValid } = useAuthStore();

  const isAuthorized = isAuthenticated && isTokenValid();

  return isAuthorized ? children : <Navigate to="/login" />;
}
