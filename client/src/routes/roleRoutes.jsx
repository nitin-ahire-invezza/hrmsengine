import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import HRDashboard from "../components/HRDashboard";
import User from "../components/User";
import RefillLeaves from "../components/admin/leave/RefillLeaves";
import Pim from "../components/Pim";
import Clients from "../components/Clients";
import Projects from "../components/Projects";
import Employeelist from "../components/pim/Employeelist";
import EmployeeDetails from "../components/pim/EmployeeDetails";
import Addemployee from "../components/pim/Addemployee";
import EditEmployee from "../components/pim/EditEmployee";
import ViewEmployee from "../components/pim/ViewEmployee";
import Addclient from "../components/client/Addclient";
import ViewClient from "../components/client/ViewClient";
import Addproject from "../components/projects/Addproject";
import ViewProject from "../components/project/ViewProject";
import Timesheet from "../components/timesheet/TimeSheet";
import ChatBox from "../components/shared/ChatBox";

//userprofile
import UserProfile from "../components/userprofile/UserProfile";
import UserLeave from "../components/userleave/UserLeave";
import AttendanceHistory from "../components/dashboard/AttendanceHistory";
import Settings from "../components/admin/settings/Settings";
import LogViewer from "../components/admin/settings/LogViewer";
import TeamList from "../components/pim/TeamList";

// Admin routes
export const adminRoutes = [
    { index: true, component: HRDashboard, meta: { title: "Dashboard" } },

    { path: "/clients", component: Clients, meta: { title: "Clients" } },
    { path: "/clients/addclient", component: Addclient, meta: { title: "Add Client" } },
    { path: "/clients/viewclient", component: ViewClient, meta: { title: "View Client" } },

    { path: "/projects", component: Projects, meta: { title: "Projects" } },
    { path: "/projects/addproject", component: Addproject, meta: { title: "Add Project" } },
    { path: "/projects/viewproject/:projectId", component: ViewProject, meta: { title: "View Project" } },

    { path: "/Pim", component: Pim, meta: { title: "Employee List" } },
    { path: "/pim/employeelist", component: Employeelist, meta: { title: "Employee List" } },
    { path: "/pim/employee-details/:_id", component: EmployeeDetails, meta: { title: "Employee Details" } },
    { path: "/pim/addholidays", component: RefillLeaves, meta: { title: "Add Holidays" } },
    { path: "/pim/edit/:empid/:ename/:designation/:jdate/:status", component: EditEmployee },
    { path: "/pim/view/:empid/:ename/:designation/:jdate/:status", component: ViewEmployee },

    { path: "/settings", component: Settings, meta: { title: "Settings" } },
    { path: "/settings/logs", component: LogViewer, meta: { title: "System Logs" } },

    { path: "/Attendance", component: AttendanceHistory, meta: { title: "Attendance" } },
    { path: "/chat", component: ChatBox, meta: { title: "Chat" }, passTheme: true },
];

// HR routes
export const hrRoutes = [
    { index: true, component: HRDashboard, meta: { title: "Dashboard" } },

    { path: "/Pim", component: Pim, meta: { title: "Employee List" } },
    { path: "/pim/employeelist", component: Employeelist, meta: { title: "Employee List" } },
    { path: "/pim/employee-details/:_id", component: EmployeeDetails, meta: { title: "Employee Details" } },
    { path: "/pim/addholidays", component: RefillLeaves, meta: { title: "Add Holidays" } },
    { path: "/pim/view/:empid/:ename/:designation/:jdate/:status", component: ViewEmployee },

    { path: "/settings", component: Settings, meta: { title: "Settings" } },

    { path: "/myprofile", component: UserProfile, meta: { title: "User Profile" } },
    { path: "/leave", component: UserLeave, meta: { title: "User Leaves" } },

    { path: "/Attendance", component: AttendanceHistory, meta: { title: "Attendance" } },
    { path: "/chat", component: ChatBox, meta: { title: "Chat" }, passTheme: true },
];

// Manager routes
export const managerRoutes = [
    { index: true, component: HRDashboard, meta: { title: "Dashboard" } },

    { path: "/clients", component: Clients, meta: { title: "Clients" } },
    { path: "/clients/addclient", component: Addclient, meta: { title: "Add Client" } },
    { path: "/clients/viewclient", component: ViewClient, meta: { title: "View Client" } },

    { path: "/projects", component: Projects, meta: { title: "Projects" } },
    { path: "/projects/addproject", component: Addproject, meta: { title: "Add Project" } },
    { path: "/projects/viewproject/:projectId", component: ViewProject, meta: { title: "View Project" } },

    { path: "/pim/employee-details/:_id", component: EmployeeDetails, meta: { title: "Employee Details" } },
    { path: "/timesheet", component: Timesheet, meta: { title: "Timesheet" } },
    { path: "/viewteam", component: TeamList, meta: { title: "Team List" } },


    { path: "/myprofile", component: UserProfile, meta: { title: "User Profile" } },
    { path: "/leave", component: UserLeave, meta: { title: "User Leaves" } },

    { path: "/Attendance", component: AttendanceHistory, meta: { title: "Attendance" } },
    { path: "/chat", component: ChatBox, meta: { title: "Chat" }, passTheme: true },
];

// Employee Routes
export const employeeRoutes = [
    { index: true, component: Dashboard, meta: { title: "Dashboard" } },

    { path: "/myprofile", component: UserProfile, meta: { title: "User Profile" } },
    { path: "/leave", component: UserLeave, meta: { title: "User Leaves" } },
    { path: "/timesheet", component: Timesheet, meta: { title: "Timesheet" } },

    { path: "/Attendance", component: AttendanceHistory, meta: { title: "Attendance" } },
    { path: "/chat", component: ChatBox, meta: { title: "Chat" }, passTheme: true },
];