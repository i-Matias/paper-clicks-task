import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Login from "../pages/login/index";
import PrivateRoute from "./PrivateRoute";

export default function Content() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div>Home</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
