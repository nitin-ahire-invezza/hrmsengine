const Timesheet = require("../model/timesheetModel");
const Employee = require("../model/employeeModel");
const { validationResult } = require("express-validator");
const Project = require("../model/projectModel");
const Attendance = require("../model/attendaceModel");
const mongoose = require("mongoose");

/**
 * Creates or updates a timesheet entry for an employee.
 *
 * Flow:
 * 1. Validates request input.
 * 2. Verifies employee and project existence.
 * 3. Ensures employee is assigned to the project and project is active.
 * 4. Checks attendance for the given date:
 *    - Must be Present (1) or Half Day (2).
 *    - Half day requires minimum working hours of 4.5.
 * 5. Creates a new timesheet or appends task to existing one.
 *
 * Key Rules:
 * - Timesheet cannot be filled if employee was absent.
 * - Employee must belong to the project.
 * - Project must be active.
 *
 * Responses:
 * - 200 → Timesheet saved successfully
 * - 400 → Validation / business rule failure
 * - 500 → Server error
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const fillTimesheet = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array().map((err) => err.msg),
      });
    }

    const {
      employee_id,
      date,
      taskName,
      subTaskName,
      description,
      duration,
      remark,
      project,
    } = req.body;

    const employee = await Employee.findOne({ _id: employee_id });
    const projectdetails = await Project.findOne({ _id: project });


    // Check if employee is assigned (assignto contains objects, so we extract _id values)
    const isAssigned = projectdetails.assignto.some(assign => assign._id.toString() === employee_id);

    if (!isAssigned) {
      return res.status(400).json({
        success: false,
        msg: "You're not assigned to this project.",
      });
    }
    if (projectdetails.status === 1) {
      return res.status(400).json({
        success: false,
        msg: "This project is inactive now, Contact to Admin to active it",
      });
    }

    if (!employee) {
      return res.status(400).json({
        success: false,
        msg: "Employee does not exist",
      });
    }
    if (!projectdetails) {
      return res.status(400).json({
        success: false,
        msg: "Project does not exist",
      });
    }

    const empid = employee.empid;

    // Check attendance for the provided date
    const attendance = await Attendance.findOne({ employee_id, date });

    if (
      !attendance ||
      (attendance.attendancestatus !== 1 && attendance.attendancestatus !== 2)
    ) {

      return res.status(400).json({
        success: false,
        msg: "We see that you were absent on this day",
      });
    }

    const totalHours = attendance.totalhrs / (60 * 60 * 1000); // Convert milliseconds to hours

    if (attendance.attendancestatus === 2 && totalHours < 4.5) {

      return res.status(400).json({
        success: false,
        msg: "You have not completed the minimum required hours for the day",
      });
    }

    // Check if a timesheet entry for the given date already exists
    let timesheet = await Timesheet.findOne({ employee_id, date });

    const task = {
      taskName,
      subTaskName,
      description,
      duration,
      remark, // Ensure remark is included here
      project: projectdetails._id, // Store only the reference ID
    };

    if (timesheet) {
      // If it exists, update the tasks array
      task.timesheet_id = timesheet._id;
      timesheet.task.push(task);
      await timesheet.save();
    } else {
      // If it does not exist, create a new timesheet document
      timesheet = new Timesheet({
        employee_id,
        empid,
        date,
        task: [task],
      });
    }
    const savedTimesheet = await timesheet.save();

    await Timesheet.updateOne(
      { _id: savedTimesheet._id },
      {
        $set: {
          "task.$[elem].timesheet_id": savedTimesheet._id,
        },
      },
      {
        arrayFilters: [{ "elem.timesheet_id": null }],
      }
    );

    return res.status(200).json({
      success: true,
      msg: "Timesheet data added successfully",
      data: timesheet,
    });
  } catch (error) {
    console.error("Error saving timesheet:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to add timesheet data",
      error: error.message,
    });
  }
};

const getTimesheetByDateForEmployee = async (req, res) => {
  try {
    const { employee_id, date } = req.body; // Only taking 'date' instead of startDate and endDate

    if (!employee_id || !date) {
      return res.status(400).json({
        success: false,
        msg: "Missing required request body parameters",
      });
    }
    const timesheets = await Timesheet.find({ 
      employee_id, 
      date, // Directly filtering by the exact date 
      }) 
      .populate({ 
        path: "task.project", 
        // select: "projectName", 
      }) 
      .populate({ 
        path: "task.timesheet_id",
         select: "_id", // Adjust the fields to select as needed 
      });

    // If no timesheets found for that date, return an empty response
    if (timesheets.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No timesheet data found for the given date",
      });
    }

    // Aggregate tasks by date (though in this case, it will always be the same date)
    const groupedByDate = timesheets.reduce((acc, timesheet) => {
      const formattedDate = timesheet.date; // The date is already in the desired format

      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate] = acc[formattedDate].concat(timesheet.task);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: groupedByDate,
    });
  } catch (error) {
    console.error("Error fetching timesheet data:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to fetch timesheet data",
      error: error.message,
    });
  }
};

/**
 * Common helper function to fetch timesheets with proper access control
 * @param {ObjectId} eidObjectId - Logged-in employee's ID
 * @param {ObjectId} employeeObjectId - Target employee's ID whose timesheets to fetch
 * @param {Object} additionalFilters - Additional query filters (e.g., { date: "2026-02-10" })
 * @returns {Object} { timesheets: Array, isPrivileged: Boolean, allowedProjectIds: Array }
 */
const fetchTimesheetsWithAccessControl = async (eidObjectId, employeeObjectId, additionalFilters = {}) => {
  // 1) Lookup logged-in user's auth level
  const loggedInEmployee = await Employee.findById(eidObjectId).select("auth").lean();
  
  if (!loggedInEmployee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  const isPrivileged = [1, 2].includes(loggedInEmployee.auth);

  let timesheetQuery = {
    employee_id: employeeObjectId,
    ...additionalFilters
  };

  let allowedProjectIds = [];

  // 2) If not privileged, find projects managed by the logged-in user
  if (!isPrivileged) {
    const allowedProjects = await Project.find({
      managerId: eidObjectId
    }).select("_id").lean();

    allowedProjectIds = allowedProjects.map(p => p._id.toString());

    if (allowedProjectIds.length === 0) {
      // No managed projects = no timesheets accessible
      return { 
        timesheets: [], 
        isPrivileged, 
        allowedProjectIds 
      };
    }

    // Filter timesheets that have at least one task in managed projects
    timesheetQuery["task.project"] = { $in: allowedProjects.map(p => p._id) };
  }

  // 3) Fetch timesheets
  let timesheets = await Timesheet.find(timesheetQuery)
    .populate({
      path: "task.project",
    })
    .populate({
      path: "task.timesheet_id",
      select: "_id",
    })
    .lean();

  // 4) If not privileged, filter tasks to only show those from managed projects
  if (!isPrivileged) {
    timesheets = timesheets
      .map(timesheet => {
        const filteredTasks = timesheet.task.filter(task => {
          if (!task.project || !task.project._id) {
            return false;
          }
          return allowedProjectIds.includes(task.project._id.toString());
        });

        if (filteredTasks.length === 0) {
          return null;
        }

        return {
          ...timesheet,
          task: filteredTasks
        };
      })
      .filter(Boolean);
  }

  return { 
    timesheets, 
    isPrivileged, 
    allowedProjectIds 
  };
};

/**
 * Retrieves timesheet tasks for a specific employee on a given date,
 * applying access control via shared helper.
 *
 * Flow:
 * 1. Validates required parameters (eid, employee_id, date).
 * 2. Applies access control using fetchTimesheetsWithAccessControl().
 * 3. Filters timesheets by date.
 * 4. Groups and returns tasks by date.
 *
 * Responses:
 * - 200 → Timesheet data grouped by date
 * - 400 → Missing parameters
 * - 404 → No data found / employee not found
 * - 500 → Server error
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getTimesheetByDate = async (req, res) => {
  try {
    const { eid, employee_id, date } = req.body;
    
    if (!eid || !employee_id || !date) {
      return res.status(400).json({
        success: false,
        msg: "Missing required request body parameters",
      });
    }

    const eidObjectId = new mongoose.Types.ObjectId(eid);
    const employeeObjectId = new mongoose.Types.ObjectId(employee_id);

    // Use the shared helper function
    const { timesheets } = await fetchTimesheetsWithAccessControl(
      eidObjectId,
      employeeObjectId,
      { date: date }
    );

    if (timesheets.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No timesheet data found for the given date",
      });
    }

    // Aggregate tasks by date (function-specific logic)
    const groupedByDate = timesheets.reduce((acc, timesheet) => {
      const formattedDate = timesheet.date;
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate] = acc[formattedDate].concat(timesheet.task);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: groupedByDate,
    });
  } catch (error) {
    console.error("Error fetching timesheet data:", error);
    
    if (error.message === "EMPLOYEE_NOT_FOUND") {
      return res.status(404).json({ 
        success: false, 
        msg: "Logged-in employee not found" 
      });
    }
    
    return res.status(500).json({
      success: false,
      msg: "Failed to fetch timesheet data",
      error: error.message,
    });
  }
};

/**
 * Retrieves total task durations per date for a specific employee
 * within a given year, applying access control.
 *
 * Flow:
 * 1. Validates required parameters (eid, employee_id, year).
 * 2. Fetches accessible timesheets using shared helper.
 * 3. Filters entries by specified year.
 * 4. Calculates total task duration per date.
 *
 * Responses:
 * - 200 → Array of { date, totalDuration }
 * - 400 → Missing parameters
 * - 404 → Employee not found
 * - 500 → Server error
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getYearlyDurations = async (req, res) => {
  try {
    const { eid, employee_id, year } = req.body;

    if (!eid || !employee_id || !year) {
      return res.status(400).json({
        success: false,
        msg: "Missing required request body parameters",
      });
    }

    const eidObjectId = new mongoose.Types.ObjectId(eid);
    const employeeObjectId = new mongoose.Types.ObjectId(employee_id);

    // Use the shared helper function (no date filter, get all timesheets)
    const { timesheets } = await fetchTimesheetsWithAccessControl(
      eidObjectId,
      employeeObjectId
    );

    // Filter timesheets to include only those within the specified year 
    const filteredData = timesheets.filter((item) => {
      const itemYear = new Date(item.date).getFullYear();
      return itemYear === parseInt(year, 10);
    });

    // Filter further to only include dates with tasks
    const validData = filteredData.filter((entry) => entry.task.length > 0);

    // Map through each valid date, calculate total duration, and format the result
    const result = validData.map((entry) => {
      const totalDuration = entry.task.reduce(
        (acc, task) => acc + task.duration,
        0
      );
      return {
        date: entry.date,
        totalDuration,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching yearly durations:", error);
    
    if (error.message === "EMPLOYEE_NOT_FOUND") {
      return res.status(404).json({ 
        success: false, 
        msg: "Logged-in employee not found" 
      });
    }
    
    return res.status(500).json({
      success: false,
      msg: "Failed to fetch yearly durations",
      error: error.message,
    });
  }
};

const getTimesheetdays = async (req, res) => {
  const { employee_id } = req.body;

  if (!employee_id) {
    return res.status(400).json({
      success: false,
      msg: "Missing required request body parameters",
    });
  }

  try {
    // Fetch timesheets for the given employee_id and include only those where the task array length is 0 or more than 0
    const timesheets = await Timesheet.find({
      employee_id,
      $or: [{ "task.0": { $exists: true } }, { task: { $size: 1 } }],
    })
      .select("date task") // Select the date and task fields
      .lean(); // Use lean() to get plain JavaScript objects

    // Extract and return the dates
    const dates = timesheets.map((timesheet) => timesheet.date);

    return res.status(200).json({
      success: true,
      dates,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

const viewTimesheet = async (req, res) => {
  try {
    const { employee_id } = req.body; // Get the employee_id from the request body

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        msg: "Employee ID is required",
      });
    }

    // Fetch timesheet data for the specified employee
    const timesheetData = await Timesheet.find({ employee_id }) // Filter by employee_id
      .populate("employee_id task.project");

    if (timesheetData.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No timesheet data found for this employee",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Timesheet Fetched successfully",
      data: timesheetData,
    });
  } catch (error) {
    console.error("Error fetching timesheet:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to fetch timesheet data",
      error: error.message,
    });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const projectData = await Project.find({});

    return res.status(200).json({
      success: true,
      msg: "Timesheet Fetched successfully",
      data: projectData,
    });
  } catch (error) {
    console.error("Error saving timesheet:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to add timesheet data",
      error: error.message,
    });
  }
};

// const deleteTimesheet = async (req, res) => {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         msg: "Validation errors",
//         errors: errors.array(),
//       });
//     }

//     const { id } = req.body;

//     const timesheetData = await Timesheet.find({ _id: id });

//     if (!timesheetData) {
//       return res.status(500).json({
//         success: false,
//         msg: "Task id not found to delete timesheet data",
//       });
//     }

//     await Timesheet.findByIdAndDelete({ _id: id });

//     return res.status(200).json({
//       success: true,
//       msg: "Timesheet Deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error saving timesheet:", error);
//     return res.status(500).json({
//       success: false,
//       msg: "Failed to add timesheet data",
//       error: error.message,
//     });
//   }
// };

const deleteTimesheet = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array().map((err) => err.msg),
      });
    }

    const { timesheetId, taskId } = req.body;

    // Find the Timesheet document and check if it exists
    const timesheetData = await Timesheet.findOne({ _id: timesheetId });

    if (!timesheetData) {
      return res.status(404).json({
        success: false,
        msg: "Timesheet not found",
      });
    }

    // Remove the specific task from the array
    const result = await Timesheet.updateOne(
      { _id: timesheetId },
      { $pull: { task: { _id: taskId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        msg: "Task not found in the timesheet",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to delete task",
      error: error.message,
    });
  }
};

// const updateTimesheet = async (req, res) => {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         msg: "Validation errors",
//         errors: errors.array(),
//       });
//     }

//     const { id, date, taskName, subTaskName, description, duration } = req.body;

//     const timesheetData = await Timesheet.findOne({ _id: id });

//     if (!timesheetData) {
//       return res.status(400).json({
//         success: false,
//         msg: "Task id not found to update timesheet data",
//       });
//     }

//     const updatedTimesheetData = await Timesheet.findByIdAndUpdate(
//       { _id: id },
//       {
//         $set: {
//           taskName,
//           date,
//           subTaskName,
//           description,
//           duration,
//         },
//       },
//       { new: true }
//     ).populate("employee_id");

//     return res.status(200).json({
//       success: true,
//       msg: "Timesheet Updated successfully",
//       data: updatedTimesheetData,
//     });
//   } catch (error) {
//     console.error("Error saving timesheet:", error);
//     return res.status(500).json({
//       success: false,
//       msg: "Failed to add timesheet data",
//       error: error.message,
//     });
//   }
// };

const updateTimesheet = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array().map((err) => err.msg),
      });
    }

    const {
      timesheet_id,
      task_id,
      taskName,
      subTaskName,
      description,
      duration,
      remark,
      project,
      date,
    } = req.body;

    // Check if timesheet_id and task_id are provided
    if (!timesheet_id || !task_id) {
      return res.status(400).json({
        success: false,
        msg: "Timesheet ID and Task ID are required",
      });
    }

    // Find the timesheet
    const timesheet = await Timesheet.findById(timesheet_id).populate({
      path: "task.timesheet_id",
      select: "_id", // Adjust the fields to select as needed
    });

    if (!timesheet) {
      return res.status(400).json({
        success: false,
        msg: "Timesheet not found",
      });
    }

    // Log timesheet for debugging
    console.log("Timesheet:", timesheet);

    // Find the index of the task to be updated
    const taskIndex = timesheet.task.findIndex((task) => {
      // Ensure task._id is defined
      if (task._id && task_id) {
        return task._id.toString() === task_id.toString();
      }
      return false;
    });

    // Log task index for debugging
    console.log("Task Index:", taskIndex);

    if (taskIndex === -1) {
      return res.status(400).json({
        success: false,
        msg: "Task not found within the timesheet",
      });
    }

    // Update the task
    timesheet.task[taskIndex] = {
      ...timesheet.task[taskIndex],
      timesheet_id: timesheet._id,
      taskName: taskName || timesheet.task[taskIndex].taskName,
      subTaskName: subTaskName || timesheet.task[taskIndex].subTaskName,
      description: description || timesheet.task[taskIndex].description,
      duration: duration || timesheet.task[taskIndex].duration,
      remark: remark || timesheet.task[taskIndex].remark,
      project: project || timesheet.task[taskIndex].project,
      date: date || date,
    };

    // Optionally update the date of the timesheet
    // if (date) {
    //   timesheet.date = date;
    // }

    // Save the updated timesheet
    const updatedTimesheet = await timesheet.save();

    return res.status(200).json({
      success: true,
      msg: "Timesheet updated successfully",
      data: updatedTimesheet,
    });
  } catch (error) {
    console.error("Error updating timesheet:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to update timesheet",
      error: error.message,
    });
  }
};

module.exports = {
  fillTimesheet,
  getTimesheetByDate,
  viewTimesheet,
  deleteTimesheet,
  updateTimesheet,
  getProjectDetails,
  getTimesheetdays,
  getYearlyDurations,
  getTimesheetByDateForEmployee
};
