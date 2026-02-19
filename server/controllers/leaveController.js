const LeaveApplication = require("../model/leaveApplicationModel");
const LeaveBalance = require("../model/leaveBalanceModel");
const Employeeprofile = require("../model/employeeProfile");
const { validationResult } = require("express-validator");
const { sendLog } = require('../controllers/admin/settingController');
const mongoose = require("mongoose");


const getLeaveDetails = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array().map((err) => err.msg),
      });
    }

    const { employee_id } = req.body;

    // Validate that employee_id is provided
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        msg: "Employee ID is required",
      });
    }

    // Find the leave balance record for the specified employee_id
    const leaveRecord = await LeaveBalance.findOne({ employee_id }).populate(
      "employee_id",
      "_id"
    );

    // Check if a record was found
    if (!leaveRecord) {
      return res.status(404).json({
        success: false,
        msg: `No leave records found for employee_id: ${employee_id}`,
      });
    }

    // Create a response structure with the holidays
    const holidays = {
      employee_id: leaveRecord.employee_id,
      leaves: leaveRecord.leaves,
      optionalholiday: leaveRecord.optionalholiday,
      mandatoryholiday: leaveRecord.mandatoryholiday,
      weekendHoliday: leaveRecord.weekendHoliday,
    };

    res.status(200).json({
      success: true,
      holidays: holidays,
    });
  } catch (error) {
    console.error("Error viewing holidays:", error);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message,
    });
  }
};


/**
 * Helper function to get all dates between two date strings (inclusive)
 * @param {String} startDateStr - Date string in YYYY-MM-DD format
 * @param {String} endDateStr - Date string in YYYY-MM-DD format
 * @returns {Array<String>} Array of date strings in YYYY-MM-DD format
 */
const getDatesInRange = (startDateStr, endDateStr) => {
  const dates = [];
  const currentDate = new Date(startDateStr + 'T00:00:00.000Z');
  const endDate = new Date(endDateStr + 'T00:00:00.000Z');

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dates.push(dateStr);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
};

/**
 * Checks whether a new leave request overlaps with any
 * existing pending leave applications (applicationstatus = 0)
 * for the same employee.
 *
 * Flow:
 * 1. Validates required inputs (fromDate, toDate, employee_id).
 * 2. Fetches all pending leave applications for the employee.
 * 3. Expands date ranges into individual date arrays.
 * 4. Detects:
 *    - Overlap between incoming and existing dates.
 *    - Duplicate dates within existing records (data integrity check).
 *
 * Returns:
 * - true  → Overlapping leave found
 * - false → No overlap
 * - throws Error → Invalid input or data integrity issue
 *
 * @param {string} fromDate
 * @param {string} toDate
 * @param {string} employee_id
 * @returns {Promise<boolean>}
 */
const checkOverlapLeaveApplication = async (fromDate, toDate, employee_id) => {
  try {

    // Validate inputs
    if (!fromDate || !toDate || !employee_id) {
      throw new Error("Missing required parameters: fromDate, toDate, or employee_id");
    }

    // Convert employee_id to ObjectId
    const employeeObjectId = new mongoose.Types.ObjectId(employee_id);

    // Step 1: Query leave applications with applicationstatus = 0 
    const existingLeaveApplications = await LeaveApplication.find({
      employee_id: employeeObjectId,
      applicationstatus: 0
    }).lean();


    // If no existing pending applications, no overlap possible
    if (!existingLeaveApplications || existingLeaveApplications.length === 0) {
      console.log("No existing pending applications - no overlap");
      return false;
    }

    // Step 2: Create Bucket 1 - incomingLeavesDaysArray
    const incomingLeavesDaysArray = getDatesInRange(fromDate, toDate);

    // Create Bucket 2 - existingLeavesDaysArray
    const existingLeavesDaysArray = [];
    const dateTracker = new Set();

    for (const application of existingLeaveApplications) {
      const { fromdate, todate, _id } = application;
      
      if (!fromdate || !todate) {
        console.warn(`Warning: Application ${_id} missing fromdate or todate`);
        continue;
      }

      // Get all dates for this application
      const applicationDates = getDatesInRange(fromdate, todate);
      
      // Check for duplicates before adding to bucket 2
      for (const dateStr of applicationDates) {
        if (dateTracker.has(dateStr)) {
          // Found a duplicate date in existing records
          const duplicateInfo = {
            applicationId: _id,
            date: dateStr,
            fromDate: fromdate,
            toDate: todate
          };
          console.error("Duplicate date found in existing records:", duplicateInfo);
          throw new Error(
            `Data integrity error: Duplicate leave date (${dateStr}) found in existing application (ID: ${_id})`
          );
        }
        
        dateTracker.add(dateStr);
        existingLeavesDaysArray.push(dateStr);
      }
    }

    // Step 3: Compare both buckets - check for any overlap
    for (const incomingDate of incomingLeavesDaysArray) {
      if (existingLeavesDaysArray.includes(incomingDate)) {
        console.log(`Overlap found: ${incomingDate} exists in both buckets`);
        return true; // Overlap detected
      }
    }

    return false; // No overlap

  } catch (error) {
    console.error("Error in checkOverlapLeaveApplication:", error);
    throw error; 
  }
};


// Function to apply for leave
const applyLeave = async (req, res) => {
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
      fromdate,
      todate,
      leavetype,
      leavesubtype,
      holidayname,
      reason,
      halfday,
      totaldays,
      halfday_post_lunch
    } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required." });
    }
    // if (!reason.length <= 10) {
    //   return res.status(400).json({ message: "Add Mininum Description." });
    // }

    // Validate input data
    if (
      !employee_id ||
      !leavetype ||
      (leavetype === "leave" && (!fromdate || !todate || !leavesubtype)) ||
      (leavetype === "Optional holiday" && !holidayname)
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!leavetype) {
      return res.status(400).json({ message: "leavetype required fields." });
    }
    // Convert fromdate and todate to Date objects if provided
    const fromDate = fromdate ? new Date(fromdate) : null;
    const toDate = todate ? new Date(todate) : null;

    // Ensure fromdate is before or equal to todate if both are provided
    if (todate && fromDate > toDate) {
      return res
        .status(400)
        .json({ message: "From Date Should Not be Today's or any Past date." });
    }

    // Server side validation for halfday logic
    if (leavetype === "leave") {
      if (halfday) {
        // If halfday is true, then halfday_post_lunch must be explicitly provided
        if (typeof halfday_post_lunch !== "boolean") {
          return res.status(400).json({
            message:
              "Please specify whether the Half Day is Pre Lunch or Post Lunch.",
          });
        }
      } else {
        // If halfday is false, ignore halfday_post_lunch completely
        halfday_post_lunch = false;
      }
    }


    // Check if both fromdate and todate are in the past if leavetype is "leave"
    if (leavetype === "leave") {
      const currentDate = new Date();
      if (fromDate <= currentDate && toDate <= currentDate) {
        return res
          .status(400)
          .json({ message: "Cannot apply for a past leave date." });
      }
    }

    // Fetch leave balance for the employee
    const leaveBalance = await LeaveBalance.findOne({ employee_id });

    if (!leaveBalance) {
      return res.status(404).json({ message: "Leave balance not found." });
    }

    // Implement check if any other leave application exists for this given date range (fromDate, toDate)
    // Following function may throw an error as said in the function flow
     const isOverlappingLeaveApplication = await checkOverlapLeaveApplication(
        fromdate, 
        todate, 
        employee_id
      );
      
      if (isOverlappingLeaveApplication) {
        return res.status(400).json({ 
          success: false,
          message: "You already have an existing leave application for one or more dates in this range" 
        });
      }

    // Initialize the leave application
    const leaveApplication = new LeaveApplication({
      employee_id,
      fromdate: null, // Placeholder, will be set based on leave type
      todate: null, // Placeholder, will be set based on leave type
      leavetype,
      leavesubtype,
      holidayname,
      reason,
      totaldays: 0, // Placeholder, will be set based on leave type
      halfday: halfday || false,
      halfday_post_lunch: halfday_post_lunch || false,
    });

    if (leavetype === "leave") {
      // Set fromdate and todate for leave
      leaveApplication.fromdate = fromDate.toISOString().split("T")[0];
      leaveApplication.todate = toDate
        ? toDate.toISOString().split("T")[0]
        : null;

      // Calculate totaldays for leave
      const oneDay = 24 * 60 * 60 * 1000;
      let totaldays = Math.round((toDate - fromDate) / oneDay) + 1; // Including both fromdate and todate
      if (halfday) {
        totaldays > 1 ? totaldays -= totaldays*0.5 : totaldays -= 0.5; // If it's a half day leave, reduce total days by half
      }
      leaveApplication.totaldays = totaldays;

      // Check if leave balance is sufficient
      if (leaveBalance.leaves.available <= 0) {
        return res
          .status(400)
          .json({ message: "Leave balance is zero or negative." });
      }

      if (leaveBalance.leaves.available < totaldays) {
        return res.status(400).json({ message: "Not enough leave balance." });
      }

      // Deduct the totaldays from available leave balance
      // leaveBalance.leaves.available -= totaldays;
      // leaveBalance.leaves.consume += totaldays;
    } else if (leavetype === "Optional holiday") {
      // Set the fromdate and todate to the selected holiday date
      const holiday = leaveBalance.optionalholiday.optionalholidaylist.find(
        (holiday) => holiday.name === holidayname
      );

      if (!holiday) {
        return res
          .status(400)
          .json({ message: "Holiday not found in optional holiday list." });
      }

      const holidayDate = new Date(holiday.date);
      if (holidayDate < new Date()) {
        return res
          .status(400)
          .json({ message: "Cannot apply for a past holiday." });
      }

      leaveApplication.fromdate = holiday.date;
      leaveApplication.todate = holiday.date;
      leaveApplication.totaldays = 1; // Set totaldays to 1 for optional holiday

      // Check if optional holiday balance is sufficient
      if (leaveBalance.optionalholiday.available <= 0) {
        return res
          .status(400)
          .json({ message: "Not enough Optional holiday balance." });
      }

      // Deduct the optional holiday from balance
      // leaveBalance.optionalholiday.available -= 1;
      // leaveBalance.optionalholiday.consume += 1;
    }

    // Save the updated leave balance
    await leaveBalance.save();

    // Save the leave application
    await leaveApplication.save();
    
    // Update attendance records if leave is approved
    if (leaveApplication.applicationstatus === 1) {
      const startDate = new Date(leaveApplication.fromdate);
      const endDate = new Date(leaveApplication.todate);

      while (startDate <= endDate) {
        const dateStr = startDate.toISOString().split("T")[0];

        await Attendance.updateMany(
          {
            "date.employee_id": employee_id,
            "date.date": dateStr,
          },
          {
            $set: { "date.$.mark": "Leave", "date.$.attendancestatus": 0 },
          }
        );

        // Move to the next day
        startDate.setDate(startDate.getDate() + 1);
      }
    }
    sendLog(`leave application from ${employee_id} for ${totaldays}`, "info")

    return res.status(200).json({
      message: "Leave application submitted successfully",
      leaveApplication,
      success: true,
    });
  } catch (error) {
    console.error("Error applying leave:", error);

    // To account for data integrity error
    if (error.message.includes("Data integrity error")) {
      return res.status(500).json({
        success: false,
        message: "A system error was detected in existing leave records. Please contact support.",
        error: error.message
      });
    }


    return res.status(500).json({
      success: false,
      msg: "Failed to apply leave",
      error: error.message,
    });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array().map((err) => err.msg),
      });
    }

    const { applicationId } = req.body;

    // Find the leave application by ID
    const application = await LeaveApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        msg: "Leave application not found.",
      });
    }

    // Check if the leave is pending
    if (application.applicationstatus !== 0) {
      return res.status(403).json({
        success: false,
        msg: "You can only delete pending leave applications.",
      });
    }

    // Delete the pending leave application
    await LeaveApplication.findByIdAndDelete(applicationId);

    res.status(200).json({
      success: true,
      msg: "Leave application deleted successfully.",
    });
  } catch (error) {
    console.error("Error while deleting leavehistory:", error);
    res.status(500).json({
      success: false,
      msg: "delation error",
      error: error.message,
    });
  }
};

const leavehistory = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array().map((err) => err.msg),
      });
    }

    const { employee_id } = req.body;

    // Validate that employee_id is provided
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        msg: "Employee ID is required",
      });
    }

    // Find all leave history for the specified employee_id
    const leaveHistory = await LeaveApplication.find({ employee_id });

    // Check if history were found
    // if (!leaveHistory.length) {
    //   return res.status(404).json({
    //     success: false,
    //     msg: `No leave history found for employee_id: ${employee_id}`,
    //   });
    // }

    // Structure the response with all leave history
    const leavehistory = leaveHistory.map((record) => ({
      _id: record._id,
      employee_id: record.employee_id,
      fromdate: record.fromdate,
      todate: record.todate,
      leavetype: record.leavetype,
      leavesubtype: record.leavesubtype,
      holidayname: record.holidayname,
      reason: record.reason,
      applicationstatus: record.applicationstatus,
      comment: record.comment,
      totaldays: record.totaldays,
      halfday: record.halfday,
      halfday_post_lunch: record.halfday_post_lunch,
      createdAt: formatDateTime(record.createdAt),
      updatedAt: formatDateTime(record.updatedAt),
      updatedDate: formatDate(record.updatedAt),  // Separate date
      updatedTime: formatTime(record.updatedAt),
    }));

    function formatDateTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).replace(",", "");
    }

    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }); // Example: Feb 13 2025
    }

    function formatTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }); // Example: 10:18 AM (IST)
    }


    res.status(200).json({
      success: true,
      leavehistory,
    });
  } catch (error) {
    console.error("Error viewing leavehistory:", error);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message,
    });
  }
};

const allLeaveHistory = async (req, res) => {
  try {
    const leaveHistory = await LeaveApplication.find().populate({
      path: "employee_id",
      select: "name email", // Include only the `name` and `email` fields from Employee
    });

    if (!leaveHistory.length) {
      return res.status(404).json({
        success: false,
        msg: "No leave history found.",
      });
    }

    // Loop over each leave history and get the profileUrl from Employeeprofile model
    const formattedLeaveHistory = await Promise.all(
      leaveHistory.map(async (leave) => {
        // Check if employee_id exists
        if (!leave.employee_id) {
          return {
            _id: leave._id,
            employee_id: null,
            employee_name: null,
            employee_email: null,
            employee_profileUrl: null,
            fromdate: leave.fromdate,
            todate: leave.todate,
            leavetype: leave.leavetype,
            leavesubtype: leave.leavesubtype,
            holidayname: leave.holidayname,
            reason: leave.reason,
            applicationstatus: leave.applicationstatus,
            comment: leave.comment,
            totaldays: leave.totaldays,
            halfday: leave.halfday,
            createdAt: leave.createdAt,
            updatedAt: leave.updatedAt,
          };
        }

        // Fetch profileUrl from Employeeprofile based on employee_id
        const employeeProfile = await Employeeprofile.findOne({
          employee_id: leave.employee_id._id,
        });

        return {
          _id: leave._id,
          employee_id: leave.employee_id._id,
          employee_name: leave.employee_id.name,
          employee_email: leave.employee_id.email,
          employee_profileUrl: employeeProfile
            ? employeeProfile.profileUrl
            : null,
          fromdate: leave.fromdate,
          todate: leave.todate,
          leavetype: leave.leavetype,
          leavesubtype: leave.leavesubtype,
          holidayname: leave.holidayname,
          reason: leave.reason,
          applicationstatus: leave.applicationstatus,
          comment: leave.comment,
          totaldays: leave.totaldays,
          halfday: leave.halfday,
          createdAt: leave.createdAt,
          updatedAt: leave.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      leaveHistory: formattedLeaveHistory,
    });
  } catch (error) {
    console.error("Error fetching all leave history:", error);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message,
    });
  }
};

const getoptinalholidaylist = async (req, res) => {
  try {
    const { employee_id } = req.body;

    // Validate that employee_id is provided
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        msg: "Employee ID is required",
      });
    }

    // Find the leave balance record for the specified employee_id
    const leaveRecord = await LeaveBalance.findOne({ employee_id });

    // Check if a record was found
    if (!leaveRecord) {
      return res.status(404).json({
        success: false,
        msg: `No leave records found for employee_id: ${employee_id}`,
      });
    }

    // Create a response structure with the holidays
    const holidays = {
      employee_id: leaveRecord.employee_id,
      optionalholiday:
        leaveRecord.optionalholiday.optionalholidaylist &&
        leaveRecord.optionalholiday,
      mandatoryholiday: leaveRecord.mandatoryholiday,
      weekendHoliday: leaveRecord.weekendHoliday,
    };

    res.status(200).json({
      success: true,
      holidays: holidays,
    });
  } catch (error) {
    console.error("Error viewing holidays:", error);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getLeaveDetails,
  applyLeave,
  leavehistory,
  getoptinalholidaylist,
  deleteApplication,
  allLeaveHistory,
};
