const { validationResult } = require("express-validator");
const leavebalance = require("../../model/leaveBalanceModel");
const leaveapplication = require("../../model/leaveApplicationModel");
const Employee = require("../../model/employeeModel");
const { CronJob } = require("cron");
const { sendMail } = require("../../helpers/mailer");
const { sendLog } = require('./settingController');
const mongoose = require("mongoose");


const EXCLUDE_ID = "67a9bdd0dec87617f2ff2c9a"; // Admin _id exclude

// const addLeaves = async (req, res) => {
//   try {
//     // Get all employee data from the Employee model
//     const employees = await Employee.find().select("_id dateofjoining name");

//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear();
//     const endOfMarch = new Date(currentYear, 2, 31); // March 31 of the current year
//     const nextEndOfMarch = new Date(currentYear + 1, 2, 31); // March 31 of the next year

//     // Helper function to calculate total leaves based on probation end date
//     const calculateLeaves = (probationEndDate) => {
//       // Calculate the number of months from the probation end date to the next March 31
//       const monthsUntilMarch = Math.max(
//         0,
//         (nextEndOfMarch - probationEndDate) / (1000 * 60 * 60 * 24 * 30) // Approximate number of months
//       );
//       return monthsUntilMarch * 1.5; // 1.5 leaves per month
//     };

//     // Helper function to round leaves to nearest 0.5
//     const roundToNearestHalf = (value) => {
//       return Math.round(value * 2) / 2;
//     };

//     // Check if any employee's probation end date is today
//     const probationEndDatesToday = employees.filter((employee) => {
//       const probationEndDate = new Date(employee.dateofjoining);
//       probationEndDate.setMonth(probationEndDate.getMonth() + 6);
//       return (
//         probationEndDate.setHours(0, 0, 0, 0) ===
//         currentDate.setHours(0, 0, 0, 0)
//       );
//     });

//     if (probationEndDatesToday.length === 0) {
//       console.log("No employees have a probation end date today.");
//       if (res) {
//         return res.status(200).json({
//           success: true,
//           msg: "No employees' probation end date is today. No action required.",
//         });
//       }
//     }

//     // Process each employee
//     await Promise.all(
//       employees.map(async (employee) => {
//         const employee_id = employee._id;
//         const ename = employee.name;
//         const dateOfJoining = new Date(employee.dateofjoining);
//         const probationEndDate = new Date(dateOfJoining);
//         probationEndDate.setMonth(probationEndDate.getMonth() + 6);

//         // Calculate total leaves based on the probation end date
//         let totalLeaves = 0;
//         try {
//           if (probationEndDate < endOfMarch) {
//             // If probation end date is before March 31 of the current year
//             totalLeaves = 18;
//           } else {
//             // Calculate leaves based on months until the next March 31
//             totalLeaves = calculateLeaves(probationEndDate);
//             if (isNaN(totalLeaves)) {
//               throw new Error("Invalid leave calculation");
//             }
//           }
//           // Ensure totalLeaves does not exceed 18 and round to the nearest 0.5
//           totalLeaves = Math.min(totalLeaves, 18);
//           totalLeaves = roundToNearestHalf(totalLeaves);
//         } catch (error) {
//           console.error(
//             `Error calculating leaves for employee _id: ${employee_id}:`,
//             error.message
//           );
//           totalLeaves = 0; // Fallback to 0 leaves if calculation fails
//         }

//         // Find or create leave record
//         let leaveRecord = await leavebalance.findOne({ employee_id });

//         if (leaveRecord) {
//           if (leaveRecord.leaves.total != null) {
//             // Skip employees who already have a leave record with a total not null
//             console.log(
//               `Employee _id: ${ename} probationEndDate: ${probationEndDate}, already has leaves: ${leaveRecord.leaves.total}`
//             );
//             return;
//           } else {
//             // Update existing leave record for employees with total = null
//             leaveRecord.leaves.total = totalLeaves;
//             leaveRecord.leaves.available =
//               totalLeaves - (leaveRecord.leaves.consume || 0);
//             if (
//               isNaN(leaveRecord.leaves.total) ||
//               isNaN(leaveRecord.leaves.available)
//             ) {
//               throw new Error("Invalid leave values");
//             }
//             await leaveRecord.save();
//           }
//         } else {
//           // Create new leave record
//           const newLeaveRecord = new leavebalance({
//             employee_id,
//             leaves: {
//               total: totalLeaves,
//               available: totalLeaves,
//               consume: 0,
//             },
//           });
//           await newLeaveRecord.save();
//         }

//         console.log(
//           `_id: ${ename}, probationEndDate: ${probationEndDate}, totalLeaves: ${totalLeaves}`
//         );
//       })
//     );

//     if (res) {
//       res.status(200).json({
//         success: true,
//         msg: "Leaves have been processed successfully.",
//       });
//     }
//   } catch (error) {
//     console.error("Error processing leaves:", error);
//     if (res) {
//       res.status(500).json({
//         success: false,
//         msg: "Server error",
//         error: error.message,
//       });
//     } else {
//       // If res is not defined, log the error
//       console.error("Cannot send response:", error.message);
//     }
//   }
// };
/**
 * This function renews leaves on April 1 of every year.
 * Handles probationary employees. Assigns leaves once probation has ended.
 * Sets probation to 6 months. Total leaves never exceeds 18 leaves.
 * @param {Request} req 
 * @param {Response} res 
 */
// TODO (test) - Testing for leaves could be done from here.
const addLeaves = async (req, res) => {
  try {
    // Get all employee data from the Employee model
    const employees = await Employee.find().select("_id dateofjoining name");

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const endOfMarch = new Date(currentYear, 2, 31); // March 31 of the current year
    const nextEndOfMarch = new Date(currentYear + 1, 2, 31); // March 31 of the next year

    // Helper function to calculate the number of full months between two dates
    const calculateFullMonths = (startDate, endDate) => {
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();
      return (endYear - startYear) * 12 + (endMonth - startMonth);
    };

    // Helper function to round leaves to nearest 0.5
    const roundToNearestHalf = (value) => {
      return Math.round(value * 2) / 2;
    };

    // Check if today is March 31
    if (currentDate.getDate() === 1 && currentDate.getMonth() === 3) {
      // Delete all documents in the leavebalance collection
      await leavebalance.deleteMany({});
      sendLog("this is 1 april's cron with adding new leaves for all employees", "info")
      console.log('All documents in the leavebalance collection have been deleted. and Today is not 1 april to renew leaves');
    } else {
      sendLog("this is monthly cron with adding leave for probations completion employees", "info")
      console.log('Today is not 1 april to renew leave');
    }

    // Process each employee
    await Promise.all(
      employees.map(async (employee) => {
        const employee_id = employee._id;
        const ename = employee.name;
        const dateOfJoining = new Date(employee.dateofjoining);
        const probationEndDate = new Date(dateOfJoining);
        probationEndDate.setMonth(probationEndDate.getMonth() + 6);

        // Skip employees with future probation end dates
        if (probationEndDate > currentDate) {
          console.log(
            `Skipping employee ${ename} with future probation end date: ${probationEndDate}`
          );
          return;
        }

        // Calculate total leaves based on the probation end date
        let totalLeaves = 0;
        try {
          if (probationEndDate < endOfMarch) {
            // Calculate the number of full months from probation end date to March 31
            const monthsUntilMarch = calculateFullMonths(
              probationEndDate,
              endOfMarch
            );
            totalLeaves = monthsUntilMarch * 1.5;
          } else {
            // Calculate leaves based on months until the next March 31
            const monthsUntilNextMarch = calculateFullMonths(
              probationEndDate,
              nextEndOfMarch
            );
            totalLeaves = monthsUntilNextMarch * 1.5;
          }
          if (isNaN(totalLeaves)) {
            throw new Error("Invalid leave calculation");
          }
          // Ensure totalLeaves does not exceed 18 and round to the nearest 0.5
          totalLeaves = Math.min(totalLeaves, 18);
          totalLeaves = roundToNearestHalf(totalLeaves);
        } catch (error) {
          console.error(
            `Error calculating leaves for employee _id: ${employee_id}:`,
            error.message
          );
          totalLeaves = 0; // Fallback to 0 leaves if calculation fails
        }

        // Find or create leave record
        let leaveRecord = await leavebalance.findOne({ employee_id });

        if (leaveRecord) {
          if (leaveRecord.leaves.total != null) {
            // Skip employees who already have a leave record with a total not null
            console.log(
              `Name: ${ename} probationEndDate: ${probationEndDate}, already has leaves: ${leaveRecord.leaves.total}`
            );
            return;
          } else {
            // Update existing leave record for employees with total = null
            leaveRecord.leaves.total = totalLeaves;
            leaveRecord.leaves.available =
              totalLeaves - (leaveRecord.leaves.consume || 0);
            if (
              isNaN(leaveRecord.leaves.total) ||
              isNaN(leaveRecord.leaves.available)
            ) {
              throw new Error("Invalid leave values");
            }
            await leaveRecord.save();
          }
        } else {
          // Create new leave record
          const newLeaveRecord = new leavebalance({
            employee_id,
            leaves: {
              total: totalLeaves,
              available: totalLeaves,
              consume: 0,
            },
          });
          await newLeaveRecord.save();
        }

        console.log(
          `Name: ${ename}, probationEndDate: ${probationEndDate}, totalLeaves: ${totalLeaves}`
        );
      })
    );

    if (res) {
      res.status(200).json({
        success: true,
        msg: "Leaves have been processed successfully.",
      });
    }
  } catch (error) {
    console.error("Error processing leaves:", error);
    if (res) {
      res.status(500).json({
        success: false,
        msg: "Server error",
        error: error.message,
      });
    } else {
      // If res is not defined, log the error
      console.error("Cannot send response:", error.message);
    }
  }
};

const addHolidays = async (req, res) => {
  try {
    // Get the holiday data from the request body
    const { optionalholiday, mandatoryholiday, weekendHoliday } = req.body;

    // Validate input format
    if (
      !Array.isArray(optionalholiday) ||
      !Array.isArray(mandatoryholiday) ||
      !Array.isArray(weekendHoliday)
    ) {
      return res.status(400).json({
        success: false,
        msg: "Invalid data format. Ensure optionalholiday, mandatoryholiday, and weekendHoliday are arrays.",
      });
    }

    console.log(
      "optioanl",
      optionalholiday,
      "mandatory",
      mandatoryholiday,
      "weekend",
      weekendHoliday
    );

    // Find all leave balance records
    const leaveRecords = await leavebalance.find();

    // Process each leave record
    await Promise.all(
      leaveRecords.map(async (leaveRecord) => {
        // Update the leave record with new holidays
        leaveRecord.optionalholiday.optionalholidaylist = [
          ...(leaveRecord.optionalholiday.optionalholidaylist || []),
          ...optionalholiday,
        ];
        leaveRecord.mandatoryholiday = [
          ...(leaveRecord.mandatoryholiday || []),
          ...mandatoryholiday,
        ];
        leaveRecord.weekendHoliday = [
          ...(leaveRecord.weekendHoliday || []),
          ...weekendHoliday,
        ];

        // Set optionalholiday total and available to 2
        // leaveRecord.optionalholiday.total = 2;
        // leaveRecord.optionalholiday.available = 2;

        // Save the updated leave record
        await leaveRecord.save();

        // console.log("Holidays added for all employees");
      })
    );

    res.status(200).json({
      success: true,
      msg: "Holidays have been added successfully.",
    });
  } catch (error) {
    console.error("Error adding holidays:", error);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message,
    });
  }
};

const updateHolidays = async (req, res) => {
  try {
    // Get the holiday data from the request body
    const { optionalholiday, mandatoryholiday, weekendHoliday } = req.body;

    // Validate input format
    if (
      !Array.isArray(optionalholiday) ||
      !Array.isArray(mandatoryholiday) ||
      !Array.isArray(weekendHoliday)
    ) {
      return res.status(400).json({
        success: false,
        msg: "Invalid data format. Ensure optionalholiday, mandatoryholiday, and weekendHoliday are arrays.",
      });
    }

    console.log(
      "Updating holidays:",
      "optional",
      optionalholiday,
      "mandatory",
      mandatoryholiday,
      "weekend",
      weekendHoliday
    );

    // Find all leave balance records
    const leaveRecords = await leavebalance.find();

    // Process each leave record
    await Promise.all(
      leaveRecords.map(async (leaveRecord) => {
        // Function to check if a holiday exists before updating
        const updateHolidayList = (existingHolidays, newHolidays) => {
          newHolidays.forEach((newHoliday) => {
            const existingIndex = existingHolidays.findIndex(
              (h) => h.name === newHoliday.name && h.date === newHoliday.date
            );

            if (existingIndex !== -1) {
              // Update existing holiday
              existingHolidays[existingIndex] = { ...existingHolidays[existingIndex], ...newHoliday };
            } else {
              // Add new holiday if not found
              existingHolidays.push(newHoliday);
            }
          });
          return existingHolidays;
        };

        // Check if the holiday fields exist before updating
        if (!leaveRecord.optionalholiday) {
          leaveRecord.optionalholiday = { optionalholidaylist: [] };
        }
        if (!leaveRecord.mandatoryholiday) {
          leaveRecord.mandatoryholiday = [];
        }
        if (!leaveRecord.weekendHoliday) {
          leaveRecord.weekendHoliday = [];
        }

        // Update the leave record with new or modified holidays
        leaveRecord.optionalholiday.optionalholidaylist = updateHolidayList(
          leaveRecord.optionalholiday.optionalholidaylist,
          optionalholiday
        );
        leaveRecord.mandatoryholiday = updateHolidayList(
          leaveRecord.mandatoryholiday,
          mandatoryholiday
        );
        leaveRecord.weekendHoliday = updateHolidayList(
          leaveRecord.weekendHoliday,
          weekendHoliday
        );

        // Save the updated leave record
        await leaveRecord.save();
      })
    );

    res.status(200).json({
      success: true,
      msg: "Holidays have been updated successfully.",
    });
  } catch (error) {
    console.error("Error updating holidays:", error);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message,
    });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate holiday name
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        msg: "Invalid or missing holiday name",
      });
    }

    console.log("Deleting holiday with name:", name);

    // Update all records by removing holiday from any list where it appears
    const result = await leavebalance.updateMany(
      {}, // Update all employees
      {
        $pull: {
          "optionalholiday.optionalholidaylist": { name: name },
          mandatoryholiday: { name: name },
          weekendHoliday: { name: name },
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        msg: "No matching holiday found in any record.",
      });
    }

    res.status(200).json({
      success: true,
      msg: "Holiday deleted successfully for all employees.",
    });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message,
    });
  }
};

// const deleteHoliday = async (req, res) => {
//   try {
//     const { holidayid } = req.body;

//     if (!holidayid) {
//       return res.status(400).json({
//         success: false,
//         msg: "Holiday ID is required for delete",
//       });
//     }

//     const holidayRecords = await leavebalance.findOne({
//       _id: holidayid,
//     });

//     if (!holidayRecords) {
//       return res.status(404).json({
//         success: false,
//         msg: "Holiday not found",
//       });
//     }

//     await leavebalance.deleteOne({ _id: holidayid });
//     return res.status(200).json({
//       success: true,
//       msg: "Holiday deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting Holiday:", error);
//     return res.status(500).json({
//       success: false,
//       msg: "Failed to delete Holiday",
//       error: error.message,
//     });
//   }
// };

const viewHolidays = async (req, res) => {
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
    const leaveRecord = await leavebalance.findOne({ employee_id });

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

const updateOptionalHolidaysOnJan1st = async () => {
  try {
    // Find all leave balance records
    const leaveRecords = await leavebalance.find();

    // Process each leave record
    await Promise.all(
      leaveRecords.map(async (leaveRecord) => {
        // Set optionalholiday total and available to 1
        leaveRecord.optionalholiday.total = 1;
        leaveRecord.optionalholiday.available = 1;

        // Save the updated leave record
        await leaveRecord.save();
      })
    );

    console.log("Optional holidays have been updated for all employees.");
  } catch (error) {
    console.error("Error updating optional holidays:", error);
  }
};

const updateLeaveBalanceForNewEmployee = async (req, res) => {
  try {
    const Admin_id = "67a1f46ab05236c93a55c166";
    const rawData = await leavebalance.findOne({ employee_id: Admin_id });

    const { employee_id } = req.body;

    // Validate that Employee_id is provided
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        msg: "Employee ID is required",
      });
    }

    const leaveRecord = await leavebalance.find({ employee_id });

    if (!leaveRecord) {
      return res.status(404).json({
        success: false,
        msg: "Leave record not found",
      });
    }

    // Clone specific fields from rawData to leaveRecord
    leaveRecord.optionalholiday.optionalholidaylist = [
      ...rawData.optionalholiday.optionalholidaylist,
    ];
    leaveRecord.mandatoryholiday = [...rawData.mandatoryholiday];
    leaveRecord.weekendHoliday = [...rawData.weekendHoliday];

    // Optionally save if you need to persist the changes in the database
    await leaveRecord.save();

    return res.status(200).json({
      success: true,
      data: leaveRecord, // Return the updated leaveRecord
    });
  } catch (error) {
    console.error("Error updating leave balance:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

const approveLeave = async (req, res) => {
  try {
    const { employee_id, application_id, applicationstatus, comment } = req.body;

    // Check if employee exists
    const isEmployee = await leaveapplication.findOne({ employee_id });
    if (!isEmployee) {
      return res.status(400).json({
        success: false,
        msg: "No employee found",
      });
    }

    const currentApplication = await leaveapplication.findOne({
      _id: application_id,
    });

    const employeeData = await Employee.findOne({ _id: employee_id });

    // Find the current application record
    const application = await leaveapplication.findOne({ _id: application_id });
    if (!application) {
      return res.status(400).json({
        success: false,
        msg: "No leave records found",
      });
    }

    // Check for today's or older dates
    const applnDate = new Date(application.fromdate); // Convert fromdate to a Date object
    const currentDate = new Date();

    // Set both dates to ignore the time portion, comparing only the dates
    const applnDateOnly = applnDate.setHours(0, 0, 0, 0);
    const currentDateOnly = currentDate.setHours(0, 0, 0, 0);

    // If applnDate is today or before, block the change
    // if (applnDateOnly <= currentDateOnly) {
    //   return res.status(400).json({
    //     success: false,
    //     msg: "You can't change old application status",
    //   });
    // }

    // Get the current application status
    const currentStatus = application.applicationstatus;

    // Check if currentStatus is the same as the new applicationstatus

    const statusMessages = {
      0: "Pending",
      1: "Approved",
      2: "Declined",
    };
    if (currentStatus === applicationstatus) {
      const message = statusMessages[applicationstatus] || "Unknown Status";

      return res.status(400).json({
        success: false,
        msg: `Application is already in ${message} state`,
      });
    }

    const daysofleaveapplication = application.totaldays;
    const leaveType = application.leavetype;

    // Find employee leave balance
    const findemployeetominus = await leavebalance.findOne({
      employee_id,
    });

    // Condition 1: If applicationstatus is changing to 1 (deduct leave balance)
    if (applicationstatus === 1) {
      if (leaveType === "leave") {
        if (
          findemployeetominus.leaves.available - daysofleaveapplication >=
          0
        ) {
          findemployeetominus.leaves.available -= daysofleaveapplication;
          findemployeetominus.leaves.consume += daysofleaveapplication;
        } else {
          return res.status(400).json({
            success: false,
            msg: "Not enough leave balance.",
          });
        }
      } else if (leaveType === "Optional holiday") {
        if (
          findemployeetominus.optionalholiday.available -
          daysofleaveapplication >=
          0
        ) {
          findemployeetominus.optionalholiday.available -=
            daysofleaveapplication;
        } else {
          return res.status(400).json({
            success: false,
            msg: "Not enough available optional holidays",
          });
        }
      }
    }

    // Condition 2: If applicationstatus was 1 and is now 0 (reverse the balances)
    if (currentStatus === 1 && applicationstatus === 0) {
      if (leaveType === "leave") {
        findemployeetominus.leaves.available += daysofleaveapplication;
        findemployeetominus.leaves.consume -= daysofleaveapplication;
      } else if (leaveType === "Optional holiday") {
        findemployeetominus.optionalholiday.available += daysofleaveapplication;
      }
    }

    // New Condition 3: If currentStatus is 1 and applicationstatus is 2 (reverse the balances like Condition 2)
    if (currentStatus === 1 && applicationstatus === 2) {
      if (leaveType === "leave") {
        findemployeetominus.leaves.available += daysofleaveapplication;
        findemployeetominus.leaves.consume -= daysofleaveapplication;
      } else if (leaveType === "Optional holiday") {
        findemployeetominus.optionalholiday.available += daysofleaveapplication;
      }
      // Save the updated leave balance after reversing
      await findemployeetominus.save();
    }

    // If currentStatus is 0 and applicationstatus is 2, only update status (no balance changes)
    // if (currentStatus === 0 && applicationstatus === 2) {
    //   await findemployeetominus.save();
    //   return res.status(200).json({
    //     success: true,
    //     msg: "Leave status updated to 2",
    //   });
    // }

    // Update the application status (only after all checks have passed)
    const newRecord = await leaveapplication.findByIdAndUpdate(
      { _id: application_id },
      { applicationstatus, comment },
      { new: true }
    );

    // Save the updated leave balance if changes were made
    if (
      (currentStatus === 1 && applicationstatus === 0) ||
      applicationstatus === 1 ||
      (currentStatus === 1 && applicationstatus === 2)
    ) {
      await findemployeetominus.save();
    }

    // mail here

    const mailContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px;  padding: 20px 10px; background-color: #f9f9f9; color: #333; line-height: 1.6; border-radius: 8px;">
    <!-- Header -->
    <div style="text-align: center; padding: 10px 0; border-bottom: 1px solid #ddd;">
      <h1 style="margin: 0; font-size: 1.5rem; color: #3b82f6;">Leave Application Status</h1>
    </div>
    <!-- Body -->
    <div style="padding: 20px;">
      <p style="margin: 0; font-size: 1rem;">
        Hello <strong style="color: #3b82f6;">${employeeData.name}</strong>,
      </p>
      <p style="margin: 10px 0 20px; font-size: 1rem; color: #555;">
        We hope this message finds you well. Here is an update on your leave application:
      </p>
      <div style="padding: 15px; background-color: white; border-left: 4px solid #3b82f6; border-radius: 6px;">
        <p style="margin: 0; font-size: 1rem; color: #333;">
          <strong>Leave Period:</strong> ${currentApplication.fromdate} to ${currentApplication.todate
      }
        </p>
        <p style="margin: 10px 0 0; font-size: 1rem; color: #333;">
          <strong>Total Days:</strong> ${currentApplication.totaldays}
        </p>
        <p style="margin: 10px 0 0; font-size: 1rem; color: #333;">
          <strong>Status:</strong> 
          ${newRecord.applicationstatus === 1
        ? `<span style="color: green; font-weight: bold;">Approved</span>`
        : newRecord.applicationstatus === 0
          ? `<span style="color: orange; font-weight: bold;">Pending</span>`
          : newRecord.applicationstatus === 2
            ? `<span style="color: red; font-weight: bold;">Declined</span>`
            : `<span style="color: gray; font-weight: bold;">Unknown</span>`
      }
        </p>
        <p style="margin: 10px 0 0; font-size: 1rem; color: #333;">
              <strong>Comment:</strong> ${newRecord.comment}
        </p>
      </div>
    </div>
    <!-- Footer -->
    <div style=" padding: 20px; border-top: 1px solid #ddd; margin-top: 20px;">
      <p style="margin: 0; font-size: 1rem; color: #333;"><strong>Best Regards,</strong></p>
      <div style="margin-top: 10px; display: flex;">
        <img src="https://res.cloudinary.com/shubshinde/image/upload/v1736494352/mhnnpoz5qv5d1xx0mf27.png" alt="Company Logo" style="width: 80px; margin-bottom: 10px;" />
        <div style="margin-left: 10px;">
        <p style="margin: 0; font-size: 1rem; color: #333;"><strong>HR Team Invezza</strong></p>
        <p style="margin: 5px 0 0; font-size: 0.9rem; color: #555;">"Empowering Your Workplace"</p>
        </div>
      </div>
    </div>
  </div>`;

    sendMail(
      employeeData.email,
      `Invezza HRMS Portal Leave Application Status`,
      mailContent
    );

    sendLog(`${employeeData.email}'s leave application status updated`, "info")


    return res.status(200).json({
      success: true,
      data: newRecord,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

// Condition 1: If applicationstatus is changing to 1 (deduct leave balance)
// Condition 2: If applicationstatus was 1 and is now 0 (reverse the balances)
// Condition 3: If currentStatus is 1 and applicationstatus is 2 (reverse the balances like Condition 2)
// If currentStatus is 0 and applicationstatus is 2, only update the status without changing balances

// addLeaves();
// updateOptionalHolidaysOnJan1st();

// const jobAddLeaves = new CronJob("*/1 * * * *", () => {
const jobAddLeaves = new CronJob("0 0 1 * *", () => {
  addLeaves();
});
// addLeaves will check by 1st of every month

// const jobUpdateOptional = new CronJob("*/1 * * * *", () => {
const jobUpdateOptional = new CronJob("0 0 1 1 *", () => {
  // updateOptionalHolidaysOnJan1st();
});
// updateOptional will check by every years 1st jan

module.exports = {
  addLeaves,
  addHolidays,
  viewHolidays,
  updateOptionalHolidaysOnJan1st,
  jobAddLeaves,
  jobUpdateOptional,
  updateLeaveBalanceForNewEmployee,
  approveLeave,
  deleteHoliday,
  updateHolidays
};
