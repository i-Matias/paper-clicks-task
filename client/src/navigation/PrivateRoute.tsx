import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

export default function PrivateRoute({
  children,
}: {
  children: ReactElement;
  permission?: string;
}): ReactElement {
  const { token, isAuthenticated } = useAuthStore();

  return token && isAuthenticated ? children : <Navigate to="/login" />;
}
