const mongoose = require("mongoose");

const leaveApplicationModel = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId, //employee model object reference to realtion
      ref: "Employee",
    },
    fromdate: {
      type: String,
    },
    todate: {
      type: String,
    },
    leavetype: {
      type: String, // Optional holiday, Leave
    },
    leavesubtype: {
      type: String, // if leavetype is leave then leavesubtype is required ("sickleave", "casualleave")
    },
    holidayname: {
      type: String, // if leavetype is Optional holiday then holidayname is required ("sickleave", "casualleave")
    },
    reason: {
      type: String,
    },
    applicationstatus: {
      type: Number, //0 pending, 1 approve, 2 reject
      default: 0,
    },
    comment: {
      type: String,
      default: ""
    },
    totaldays: {
      type: Number,
    },
    halfday: {
      type: Boolean,
      default: false,
    },
    halfday_post_lunch: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Middleware to ensure no attendance can be marked for leave dates
leaveApplicationModel.post("save", async function (doc, next) {
  const Attendance = mongoose.model("Attendance");

  if (doc.applicationstatus === 1) {
    // If leave is approved
    await Attendance.updateMany(
      {
        employee_id: doc.employee_id,
        date: { $gte: doc.fromdate, $lte: doc.todate },
      },
      { $set: { mark: "Leave", attendancestatus: 0 } }
    );
  }

  next();
});

module.exports = mongoose.model("leaveapplication", leaveApplicationModel);
