import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Callback from "../pages/callback/index";
import Login from "../pages/login/index";
import Home from "../pages/home/index";
import PrivateRoute from "./PrivateRoute";

export default function Content() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
