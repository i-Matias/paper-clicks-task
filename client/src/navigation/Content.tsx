import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Callback from "../pages/callback/index";
import Login from "../pages/login/index";
import Home from "../pages/home/index";
import UserProfilePage from "../pages/profile/index";
import PrivateRoute from "./PrivateRoute";
import { AnimatedLayout } from "../components/layout";
import LoadingSpinner from "../components/loading-spinner";

export default function Content() {
  return (
    <Suspense
      fallback={<LoadingSpinner fullScreen message="Loading application..." />}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AnimatedLayout>
                <Home />
              </AnimatedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <AnimatedLayout>
                <UserProfilePage />
              </AnimatedLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
