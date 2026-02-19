const Attendance = require("../model/attendaceModel"); // Adjust the path if needed
const LeaveApplication = require("../model/leaveApplicationModel"); // Adjust the path if needed
const Employee = require("../model/employeeModel");
const LeaveBalance = require("../model/leaveBalanceModel");
const { validationResult } = require("express-validator");
const { sendLog } = require('../controllers/admin/settingController');


const { CronJob } = require("cron");

/**
 * Handles employee punch-in and punch-out operations.
 *
 * Flow:
 * 1. Validates request and location data.
 * 2. Prevents punching during approved leave.
 * 3. Finds or creates today's attendance record.
 * 4. Enforces punch rules:
 *    - Cannot punch Out before In.
 *    - Cannot punch In/Out multiple times.
 * 5. On punch Out:
 *    - Calculates total working time.
 *    - Sets attendancestatus:
 *        1 = Full day (≥ 4 hours)
 *        2 = Half day (< 4 hours) => Even 1 hour is treated as half day
 *
 * Responses:
 * - 200 → Attendance updated successfully
 * - 400 → Validation or business rule violation
 * - 500 → Server error
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array().map((err) => err.msg),
      });
    }
    const { employee_id, mark, inlocation, outlocation } = req.body;

    // Validate location data format
    if (
      mark === "In" &&
      (!inlocation || !inlocation.latitude || !inlocation.longitude)
    ) {
      return res.status(400).json({ message: "Invalid inlocation data." });
    }

    if (
      mark === "Out" &&
      (!outlocation || !outlocation.latitude || !outlocation.longitude)
    ) {
      return res.status(400).json({ message: "Invalid outlocation data." });
    }

    // Get the current datetime and date
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
    const currentTime = now.toISOString(); // Full datetime

    // Check if the employee has an approved leave for the date
    const leave = await LeaveApplication.findOne({
      employee_id,
      fromdate: { $lte: currentDate },
      todate: { $gte: currentDate },
      applicationstatus: 1, // approved leave
    });

    if (leave) {
      return res
        .status(400)
        .json({ message: "Cannot punch in/out during approved leave dates." });
    }

    // Find the existing attendance record for the date, if any
    let attendance = await Attendance.findOne({
      employee_id,
      date: currentDate,
    });

    if (attendance) {
      if (mark === "Out") {
        if (attendance.mark === "Out") {
          return res
            .status(400)
            .json({ message: "You have already punched out today." });
        }
        if (attendance.mark !== "In") {
          return res
            .status(400)
            .json({ message: "Cannot punch out without punching in first." });
        }
        attendance.outtime = currentTime;
        attendance.outlocation = outlocation;
        attendance.mark = mark;

        if (attendance.intime && attendance.outtime) {
          const intimeDate = new Date(attendance.intime);
          const outtimeDate = new Date(attendance.outtime);

          const totalMs = outtimeDate - intimeDate;

          if (!isNaN(totalMs)) {
            attendance.totalhrs = totalMs; // Store total time in milliseconds
            attendance.attendancestatus = totalMs >= 4 * 60 * 60 * 1000 ? 1 : 2; // 1 = present full day, 2 = half day
          } else {
            attendance.totalhrs = 0;
            attendance.attendancestatus = 0; // Default to absent
          }
        }

        await attendance.save();
      } else if (mark === "In") {
        if (attendance.mark === "In") {
          return res
            .status(400)
            .json({ message: "You have already punched in today." });
        }
        if (attendance.mark === "Out") {
          return res
            .status(400)
            .json({ message: "You cannot punch in twice in a day." });
        }
        attendance.intime = currentTime;
        attendance.inlocation = inlocation;
        attendance.mark = mark;

        await attendance.save();
      } else {
        return res
          .status(400)
          .json({ message: 'Invalid mark value. Use "In" or "Out".' });
      }
    } else {
      // If no existing record, create a new attendance record
      if (mark === "Out") {
        return res
          .status(400)
          .json({ message: "Cannot punch out without punching in first." });
      }

      attendance = new Attendance({
        employee_id,
        date: currentDate,
        mark,
        intime: mark === "In" ? currentTime : undefined,
        inlocation: mark === "In" ? inlocation : undefined,
        outtime: mark === "Out" ? currentTime : undefined,
        outlocation: mark === "Out" ? outlocation : undefined,
        attendancestatus: 1,
      });

      await attendance.save();
    }

    sendLog(`employees ${employee_id} ${mark === "In" ? "punch in" : "punch out"}`, "info")


    return res
      .status(200)
      .json({ message: `employees ${employee_id} ${mark === "In" ? "punch in" : "punch out"}` , attendance });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Function to handle end-of-day logic for default paid leave
const endOfDayProcessing = async () => {
  try {
    const currentDate = new Date().toISOString().split("T")[0]; // Get today's date

    const absentEmployees = await Attendance.find({
      date: currentDate,
      mark: { $ne: "Out" },
    });

    for (const employee of absentEmployees) {
      if (!employee.mark || employee.mark === "In") {
        // If employee didn't punch out, update their attendance to 'Absent'
        employee.attendancestatus = 0; // Absent
        await employee.save();
      }
    }

    console.log("End of day processing completed.");
  } catch (error) {
    console.error("Error in end of day processing:", error);
  }
};

const getAllAttendanceRecords = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      _id: {
        $ne: req.employee._id,
      },
    });

    return res.status(200).json({ attendance });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const getAllAttendanceRecordsByDate = async (req, res) => {
  try {
    // Extract the date from req.body
    const { date } = req.body;

    if (!date) {
      return res
        .status(400)
        .json({ message: "Date is required in the request body" });
    }

    // Query the database to find attendance records that match the provided date
    const attendance = await Attendance.find({ date });

    return res.status(200).json({ attendance });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Function to get attendance for an employee
const getAttendance = async (req, res) => {
  try {
    const { employee_id } = req.body;

    const attendance = await Attendance.find({ employee_id }).sort({
      date: -1,
    });

    return res.status(200).json({ attendance });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Performs daily attendance validation for all employees.
 *
 * Flow:
 * 1. Gets today's date and day of week.
 * 2. Iterates through all employees.
 * 3. If Saturday/Sunday → sets attendance status = 3 (Week Off).
 * 4. On weekdays:
 *    - If no record exists → creates record with status = 0 (Absent).
 *    - If record exists but not marked "In" → updates status = 0 (Absent).
 *    - Deducts 1 leave from leave balance for absentees.
 *
 * Attendance Status Codes:
 *   0 = Absent
 *   3 = Week Off
 *
 * @returns {Promise<void>}
 */
const checkAttendance = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // Get today's date
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Get all employees
    const employees = await Employee.find();

    for (const employee of employees) {
      // Check if there's an attendance record for today
      let attendance = await Attendance.findOne({
        employee_id: employee._id,
        date: currentDate,
      });

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // If dayOfWeek is Saturday or Sunday, update status to week off
        if (!attendance) {
          attendance = new Attendance({
            employee_id: employee._id,
            date: currentDate,
            attendancestatus: 3, // Week off
          });
          await attendance.save();
        } else {
          attendance.attendancestatus = 3; // Week off
          await attendance.save();
        }
      } else {
        if (!attendance) {
          // If no attendance record exists, create one with status 'Absent'
          attendance = new Attendance({
            employee_id: employee._id,
            date: currentDate,
            attendancestatus: 0, // Absent
          });
          await attendance.save();

          // Update leave balance
          const leaveBalance = await LeaveBalance.findOne({
            employee_id: employee._id,
          });

          if (leaveBalance) {
            leaveBalance.leaves.available = (
              leaveBalance.leaves.available - 1
            ).toFixed(1);
            leaveBalance.leaves.consume = (
              leaveBalance.leaves.consume + 1
            ).toFixed(1);
            await leaveBalance.save();
          }
        } else if (attendance.mark !== "In") {
          // If record exists but hasn't marked "In", update status to 'Absent'
          attendance.attendancestatus = 0; // Absent
          await attendance.save();

          // Update leave balance
          const leaveBalance = await LeaveBalance.findOne({
            employee_id: employee._id,
          });

          if (leaveBalance) {
            leaveBalance.leaves.available = (
              leaveBalance.leaves.available - 1
            ).toFixed(1);
            leaveBalance.leaves.consume = (
              leaveBalance.leaves.consume + 1
            ).toFixed(1);
            await leaveBalance.save();
          }
        }
      }
    }

    console.log("Attendance check completed at 02:59 AM.");
  } catch (error) {
    console.error("Error in attendance check:", error);
  }
};
const attendaceCheck = new CronJob("59 14 * * *", checkAttendance);

/**
 * Automatically marks all employees with attendance status "In"
 * as "Out" for the current date.
 *
 * Flow:
 * 1. Gets current date and time.
 * 2. Finds attendance records where date = today and mark = "In".
 * 3. Updates each record:
 *    - mark → "Out"
 *    - sets outtime and default outlocation
 *    - calculates total working time (intime → outtime)
 *    - sets attendancestatus:
 *        1 = Full day (≥ 4 hours)
 *        2 = Half day (< 4 hours) => Even 1 hour is treated as half day
 *
 * @returns {Promise<void>}
 */
const markEmployeesOut = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toISOString();

    // Get all employees who have 'mark' as 'In'
    const employeesWithInStatus = await Attendance.find({
      date: currentDate,
      mark: "In",
    });

    if (employeesWithInStatus.length > 0) {
      for (const attendance of employeesWithInStatus) {
        console.log(`Marking employee ID: ${attendance.employee_id} as 'Out'`);
        attendance.mark = "Out";
        attendance.outtime = currentTime;
        attendance.outlocation = { latitude: 0, longitude: 0 };

        if (attendance.intime && attendance.outtime) {
          const intimeDate = new Date(attendance.intime);
          const outtimeDate = new Date(attendance.outtime);

          const totalMs = outtimeDate - intimeDate;
          attendance.totalhrs = totalMs;
          attendance.attendancestatus = totalMs >= 4 * 60 * 60 * 1000 ? 1 : 2; // 1 = present full day, 2 = half day
        }

        await attendance.save();
      }
    } else {
      console.log("No employee found with 'In' status.");
    }
  } catch (error) {
    console.error("Error in marking employees as Out:", error);
  }
};

const markAllout = new CronJob("29 19 * * *", markEmployeesOut);

module.exports = {
  markAttendance,
  endOfDayProcessing,
  getAttendance,
  attendaceCheck,
  getAllAttendanceRecords,
  getAllAttendanceRecordsByDate,
  markAllout,
  markEmployeesOut,
};
