import { createBrowserRouter } from "react-router";
import RootLayout from "./layout/RootLayout";
import Root from "./layout/Root";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Assignments from "./pages/Assignments";
import AddAssignment from "./pages/AddAssignment";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Login />,
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <Root />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: "inventory", element: <Inventory /> },
          { path: "assignments", element: <Assignments /> },
          { path: "add-assignment", element: <AddAssignment /> },
          { path: "edit-assignment/:id", element: <AddAssignment /> },
          { path: "reports", element: <Reports /> },
          { 
            path: "user-management", 
            element: (
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            ) 
          },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);