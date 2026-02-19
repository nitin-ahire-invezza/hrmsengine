import React, { useState, useEffect, useContext, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/shared/Layout";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import HRDashboard from "./components/HRDashboard";
import User from "./components/User";
import RefillLeaves from "./components/admin/leave/RefillLeaves";
import Pim from "./components/Pim";
import Clients from "./components/Clients";
import Projects from "./components/Projects";
import Employeelist from "./components/pim/Employeelist";
import EmployeeDetails from "./components/pim/EmployeeDetails";
import Addemployee from "./components/pim/Addemployee";
import EditEmployee from "./components/pim/EditEmployee";
import ViewEmployee from "./components/pim/ViewEmployee";
import Addclient from "./components/client/Addclient";
import ViewClient from "./components/client/ViewClient";
import Addproject from "./components/projects/Addproject";
import Login from "./components/Login";
import ViewProject from "./components/project/ViewProject";
import ResetPassword from "./components/ResetPassword";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "../src/contexts/AuthContext";
import NotFound from "./NotFound";
import Timesheet from "./components/timesheet/TimeSheet";
import ChatBox from "./components/shared/ChatBox";

//userprofile
import UserProfile from "../src/components/userprofile/UserProfile";
import UserLeave from "./components/userleave/UserLeave";
import AttendanceHistory from "./components/dashboard/AttendanceHistory";
import Settings from "./components/admin/settings/Settings";
import LogViewer from "./components/admin/settings/LogViewer";
import TeamList from "./components/pim/TeamList";
import { adminRoutes, hrRoutes, managerRoutes, employeeRoutes } from "./routes/roleRoutes";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const { userData, checkAndLogoutIfExpired } = useContext(AuthContext);
  const location = useLocation(); 

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Runs on every route change
    checkAndLogoutIfExpired();
    // scroll to top on navigation
    window.scrollTo(0, 0);
  }, [location.pathname, checkAndLogoutIfExpired]);

  const handleThemeSwitch = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // This effect will run only on initial load to set the theme
  // useEffect(() => {
  //   const savedTheme = localStorage.getItem("theme") || "light"; // Default to light theme
  //   document.documentElement.classList.add(savedTheme);
  // }, []); // Runs once on mount

  // // Function to toggle the theme without causing re-renders
  // const handleThemeSwitch = useCallback(() => {
  //   const currentTheme = document.documentElement.classList.contains("dark")
  //     ? "dark"
  //     : "light";
  //   const newTheme = currentTheme === "dark" ? "light" : "dark";

  //   // Update the localStorage and change the class on the document element
  //   localStorage.setItem("theme", newTheme);
  //   document.documentElement.classList.remove(currentTheme);
  //   document.documentElement.classList.add(newTheme);
  // }, []); // This callback function won't cause re-renders

  /**
   * @param routes routes Array of route config objects for the active user role
   * @returns Array of React router route elements
   */
  const renderRouteElements = (routes) =>
  routes.map((route, index) => {
    const Component = route.component;

    // Inject theme only where needed
    const element = route.passTheme
      ? <Component theme={theme} />
      : <Component />;

    if (route.index) {
      return <Route key={index} index element={element} />;
    }

    return <Route key={index} path={route.path} element={element} />;
  });


  const renderRoutes = () => {
    if (userData?.employeeData?.auth === 1) return renderRouteElements(adminRoutes);
    if (userData?.employeeData?.auth === 2) return renderRouteElements(hrRoutes);
    if (userData?.employeeData?.auth === 3) return renderRouteElements(managerRoutes);
    return renderRouteElements(employeeRoutes);
  };
  let activeRoutes = [];

  if (userData?.employeeData?.auth === 1) activeRoutes = adminRoutes;
  else if (userData?.employeeData?.auth === 2) activeRoutes = hrRoutes;
  else if (userData?.employeeData?.auth === 3) activeRoutes = managerRoutes;
  else activeRoutes = employeeRoutes;

  return (
      <Routes>
        <Route path="*" element={<NotFound theme={theme} />} />
        <Route path="/login" element={<Login theme={theme} />} />
        <Route path="/register" element={<Register theme={theme} />} />
        <Route
          path="/resetpassword"
          element={<ResetPassword theme={theme} />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute
              element={() => (
                <Layout theme={theme} handleThemeSwitch={handleThemeSwitch} routes={activeRoutes} />
              )}
            />
          }
        >
          {renderRoutes()}
        </Route>
      </Routes>
  );
}

export default App;
