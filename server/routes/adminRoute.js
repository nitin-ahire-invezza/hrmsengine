const express = require("express");
const router = express();

const auth = require("../middleware/authMiddleware");

const permissionController = require("../controllers/admin/permissionController");
const roleController = require("../controllers/admin/roleController");
const clientController = require("../controllers/admin/clientController");
const projectController = require("../controllers/admin/projectController");
const leaveAddController = require("../controllers/admin/leaveAddController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const attendanceController = require("../controllers/attendanceController");
const settingController = require("../controllers/admin/settingController");

const { onlyAdminAccess } = require("../middleware/adminMiddleware");

const {
  permissionAddValidator,
  permissionDeleteValidator,
  permissionUpdateValidator,
  storeRoleValidator,
  addClientValidator,
  updateClientValidator,
  addProjectValidator,
  updateProjectValidator,
  deleteUserValidator,
} = require("../helpers/adminValidator");

const {
  addLeavesValidator,
  addHolidayValidator,
} = require("../helpers/validation");
const { route } = require("./commonRoute");

//this routes only accessible from admin role
router.post(
  "/addpermission",
  auth,
  onlyAdminAccess,
  permissionAddValidator,
  permissionController.addPermission
);

router.get(
  "/getpermissions",
  auth,
  onlyAdminAccess,
  permissionController.getPermission
);

router.post(
  "/deletepermissions",
  auth,
  onlyAdminAccess,
  permissionDeleteValidator,
  permissionController.deletePermission
);

router.post(
  "/updatepermissions",
  auth,
  onlyAdminAccess,
  permissionUpdateValidator,
  permissionController.updatePermission
);

//role routes
router.post(
  "/storerole",
  auth,
  onlyAdminAccess,
  storeRoleValidator,
  roleController.storeRole
);

router.get(
  "/getroles",
  auth,
  onlyAdminAccess,
  storeRoleValidator,
  roleController.getroles
);

//client routes
router.post(
  "/addclient",
  auth,
  onlyAdminAccess,
  addClientValidator,
  clientController.addClient
);

router.post(
  "/updateclient", //update and change status
  auth,
  onlyAdminAccess,
  updateClientValidator,
  clientController.updateClient
);

router.get("/viewclient", auth, onlyAdminAccess, clientController.viewClient);

router.post(
  "/viewclientbyid",
  auth,
  onlyAdminAccess,
  clientController.viewClientById
);

router.post(
  "/softdeleteclient",
  auth,
  onlyAdminAccess,
  clientController.softDeleteClient
);

//project routes
router.post(
  "/addproject",
  auth,
  onlyAdminAccess,
  addProjectValidator,
  projectController.addProject
);

router.post(
  "/updateproject",
  auth,
  onlyAdminAccess,
  updateProjectValidator,
  projectController.updateProject
);

router.get(
  "/viewproject",
  auth,
  onlyAdminAccess,
  projectController.viewPorject
);

router.post(
  "/viewprojectbyid",
  auth,
  onlyAdminAccess,
  projectController.viewProjectById
);

router.post(
  "/deleteproject",
  auth,
  onlyAdminAccess,
  projectController.deleteProject
);
router.post(
  "/softdeleteproject",
  auth,
  onlyAdminAccess,
  projectController.softdeleteproject
);

router.post(
  "/viewprojectbyclientid",
  auth,
  onlyAdminAccess,
  projectController.viewProjectsByClient
);

//leave managemant routes
router.post(
  "/addleaves",
  auth,
  onlyAdminAccess,
  addLeavesValidator,
  leaveAddController.addLeaves
);

router.post(
  "/addholidays",
  auth,
  onlyAdminAccess,
  addHolidayValidator,
  leaveAddController.addHolidays
);

router.post(
  "/updateholidays",
  auth,
  onlyAdminAccess,
  leaveAddController.updateHolidays
)

router.post(
  "/deleteholidays",
  // auth,
  // onlyAdminAccess,
  leaveAddController.deleteHoliday
);

router.post(
  "/updateleavebalancefornewemployee",
  auth,
  onlyAdminAccess,
  leaveAddController.updateLeaveBalanceForNewEmployee
);

router.post(
  "/viewholidays",
  auth,
  onlyAdminAccess,
  leaveAddController.viewHolidays
);
router.post(
  "/approveLeave",
  auth,
  onlyAdminAccess,
  leaveAddController.approveLeave
);

router.get("/viewusers", auth, onlyAdminAccess, userController.viewUser);

router.post(
  "/employeedetails",
  auth,
  onlyAdminAccess,
  userController.employeedetails
);

router.post(
  "/updateemployeebyadmin",
  auth,
  onlyAdminAccess,
  authController.updateemployeebyadmin
);

router.post(
  "/deleteuser",
  auth,
  onlyAdminAccess,
  deleteUserValidator,
  userController.deleteUser
);

router.get(
  "/getallattendancerecords",
  auth,
  onlyAdminAccess,
  attendanceController.getAllAttendanceRecords
);

router.post(
  "/getattendancerecordsbydate",
  auth,
  onlyAdminAccess,
  attendanceController.getAllAttendanceRecordsByDate
);

// Settings routes


//timesheet
router.post(
  "/updatetimesheetlimit",
  auth,
  onlyAdminAccess,
  settingController.updateTimesheetLimit
);

router.get(
  "/gettimesheetlimit",
  auth,
  onlyAdminAccess,
  settingController.getTimesheetLimit
);


//department
router.post(
  "/adddepartment",
  auth,
  onlyAdminAccess,
  settingController.addDepartment
)

router.get(
  "/getdepartment",
  auth,
  onlyAdminAccess,
  settingController.getDepartments
)

router.post(
  "/deletedepartment",
  auth,
  onlyAdminAccess,
  settingController.deleteDepartment
)


//country
router.post(
  "/addcountry",
  auth,
  onlyAdminAccess,
  settingController.addCountry
)

router.get(
  "/getcountry",
  auth,
  onlyAdminAccess,
  settingController.getCountries
)

router.post(
  "/deletecountry",
  auth,
  onlyAdminAccess,
  settingController.deleteCountry
)


//reportingTo
router.post(
  "/addreportingto",
  auth,
  onlyAdminAccess,
  settingController.addReportingTo
)

router.get(
  "/getreportingto",
  auth,
  onlyAdminAccess,
  settingController.getReportingTo
)

router.post(
  "/deletereportingto",
  auth,
  onlyAdminAccess,
  settingController.deleteReportingTo
)


//designation
router.post(
  "/adddesignation",
  auth,
  onlyAdminAccess,
  settingController.addDesignation
)

router.get(
  "/getdesignation",
  auth,
  onlyAdminAccess,
  settingController.getDesignations
)

router.post(
  "/deletedesignation",
  auth,
  onlyAdminAccess,
  settingController.deleteDesignation
)

router.get(
  "/getallsettings",
  auth,
  onlyAdminAccess,
  settingController.getAllSettings
)

router.get(
  "/logs",
  // auth,
  // onlyAdminAccess,
  settingController.log
)

// TODO (dev) - Uncomment this to test for leaves - http://localhost:4000/api/admin/run-add-leaves-cron
/* router.post("/run-add-leaves-cron", async (req, res) => {
  await leaveAddController.addLeaves(req, res);
}); */

module.exports = router;
