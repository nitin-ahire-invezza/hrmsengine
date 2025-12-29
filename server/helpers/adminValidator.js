const { check } = require("express-validator");
const Setting = require("../model/settingsModel");

exports.permissionAddValidator = [
  check("permission_name", "Permission Name is required").not().isEmpty(),
];

exports.permissionDeleteValidator = [
  check("id", "Id is required to delete").not().isEmpty(),
];

exports.permissionUpdateValidator = [
  check("id", "Id is required to update").not().isEmpty(),
  check("permission_name", "Permission Name is required to update")
    .not()
    .isEmpty(),
];

const getAddTimesheetLimit = async () => {
  const setting = await Setting.findOne({}, "timesheet.addtimesheetlimit");
  return setting?.timesheet?.addtimesheetlimit || 5; // Fallback to 5 if not found
};

const getUpdateTimesheetLimit = async () => {
  const setting = await Setting.findOne({}, "timesheet.updatetimesheetlimit");
  return setting?.timesheet?.updatetimesheetlimit || 5; // Fallback to 5 if not found
};

const getDeleteTimesheetLimit = async () => {
  const setting = await Setting.findOne({}, "timesheet.deletetimesheetlimit");
  return setting?.timesheet?.deletetimesheetlimit || 5; // Fallback to 5 if not found
};

exports.timesheetAddValidator = [
  check("employee_id", "employee_id is required").not().isEmpty(),
  check("date")
    .not()
    .isEmpty()
    .withMessage("date is required")
    .custom(async (value) => {
      const addTimesheetLimit = await getAddTimesheetLimit(); // Dynamically get the limit
      const inputDate = new Date(value);
      const currentDate = new Date();
      const limitDate = new Date(currentDate);
      limitDate.setDate(currentDate.getDate() - addTimesheetLimit);

      if (inputDate > currentDate) {
        throw new Error("Date cannot be in the future");
      }
      if (inputDate < limitDate) {
        throw new Error(
          `Sorry, tasks cannot be added for dates older than ${addTimesheetLimit} days.`
        );
      }
      return true;
    }),
  check("taskName", "Task Name is required")
    .not()
    .isEmpty()
    .isLength({ max: 50 })
    .withMessage("Task Name must not exceed 50 characters"),
  check("subTaskName", "subTask Name is required")
    .not()
    .isEmpty()
    .isLength({ max: 100 })
    .withMessage("Task Name must not exceed 100 characters"),
  check("description", "Add description to your task")
    .not()
    .isEmpty()
    .isLength({ max: 250 })
    .withMessage("Task Name must not exceed 250 characters"),
  check("duration", "Add duration of your task").not().isEmpty(),
  check("project", "Specify your working project").not().isEmpty(),
  check("remark", "Specify your task status").not().isEmpty(),
];

exports.getTimesheetByDateValidator = [
  check("employee_id", "employee_id is required").not().isEmpty(),
];

exports.timesheetDeleteValidator = [
  check("timesheetId", "timesheetId is required to delete").not().isEmpty(),
  check("taskId", "taskId is required to delete").not().isEmpty(),
  check("date", "date is required and should be within the last 10 days")
    .not()
    .isEmpty()
    .toDate()
    .custom(async (value) => {
      const deleteTimesheetLimit = await getDeleteTimesheetLimit(); // Dynamically get the limit
      const inputDate = new Date(value);
      const currentDate = new Date();
      const limitDate = new Date(currentDate);
      limitDate.setDate(currentDate.getDate() - deleteTimesheetLimit);

      if (inputDate > currentDate) {
        throw new Error("Date cannot be in the future");
      }
      if (inputDate < limitDate) {
        throw new Error(
          `Sorry, tasks cannot be deleted for dates older than ${deleteTimesheetLimit} days.`
        );
      }
      return true;
    }),
];

exports.timesheetUpdateValidator = [
  check("timesheet_id", "timesheet_id is required to update").not().isEmpty(),
  check("task_id", "task_id is required to update").not().isEmpty(),
  check("taskName", "taskName is required").not().isEmpty(),
  check("date", "date is required")
    .not()
    .isEmpty()
    .isISO8601()
    .withMessage("Invalid date format")
    .toDate()
    .custom(async (value) => {
      const updateTimesheetLimit = await getUpdateTimesheetLimit(); // Dynamically get the limit
      const inputDate = new Date(value);
      const currentDate = new Date();
      const limitDate = new Date(currentDate);
      limitDate.setDate(currentDate.getDate() - updateTimesheetLimit);

      if (inputDate > currentDate) {
        throw new Error("Date cannot be in the future");
      }
      if (inputDate < limitDate) {
        throw new Error(
          `Sorry.. You cannot update tasks older than ${updateTimesheetLimit} days`
        );
      }
      return true;
    }),
];

exports.storeRoleValidator = [
  check("role_name", "role_name is required").not().isEmpty(),
  check("value", "value is required").not().isEmpty(),
];

exports.addClientValidator = [
  check("clientname", "clientname is required").not().isEmpty(),
  check("companyname", "companyname is required").not().isEmpty(),
  check("email", "email is required").not().isEmpty(),
  check("phone", "phone is required").not().isEmpty(),
];

exports.updateClientValidator = [
  check("id", "Id is required to delete").not().isEmpty(),
  check("clientname", "clientname is required").not().isEmpty(),
  check("companyname", "companyname is required").not().isEmpty(),
  check("email", "email is required").not().isEmpty(),
  check("phone", "phone is required").not().isEmpty(),
];

exports.addProjectValidator = [
  check("projectname", "projectname is required").not().isEmpty(),
  check("clientid", "clientid is required").not().isEmpty(),
  check(
    "description",
    "Description should not exceed 1000 characters"
  ).isLength({ max: 1000 }),
  check('managerId', 'managerId is required').not().isEmpty(),
];
exports.updateProjectValidator = [
  check("id", "Id is required to update project details").not().isEmpty(),
  check("projectname", "projectname is required").not().isEmpty(),
  check(
    "description",
    "Description should not exceed 1000 characters"
  ).isLength({ max: 1000 }),
  check('managerId', 'managerId is required').not().isEmpty(),
];

exports.deleteUserValidator = [check("id", "id is required").not().isEmpty()];
