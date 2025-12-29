const mongoose = require("mongoose");
const mongoSequence = require("mongoose-sequence");

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      require: true,
    },
    phone: {
      type: Number,
      default: 0,
    },
    profile: {
      type: String,
      default: "",
    },
    status: {
      type: Number,
      default: 1, // 1 = active, 0 = inactive
    },
    auth: {
      type: Number,
      default: 0, //0 emp 1 admin 2hr 3manager
    },

    // employee details

    dob: {
      type: String,
      require: true,
    },
    gender: {
      type: String,
      require: true,
    },
    maritialstatus: {
      type: String,
    },
    bloodgroup: {
      type: String,
    },

    //employeement info schema

    dateofjoining: {
      type: String,
    },
    designation: {
      type: String,
    },
    department: {
      type: String,
    },
    reportingto: {
      type: String,
    },
    teamleader: {
      type: String,
    },
    techexperties: {
      type: Array,
    },
    lastwd: {
      type: String,
    },

    // contact details

    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    zipcode: {
      type: Number,
    },

    //emergency contact details

    emergencypersonname: {
      type: String,
    },
    relation: {
      type: String,
    },
    profession: {
      type: String,
    },
    emergencypersonaddress: {
      type: String,
    },
    emergencypersonemail: {
      type: String,
    },
    emergencypersonphone: {
      type: Number,
    },

    // work experience
    workexperience: [
      {
        jobtitle: {
          type: String,
        },
        companyname: {
          type: String,
        },
        companylinkedinurl: {
          type: String,
        },
        employeementtype: {
          type: String,
        },
        startdate: {
          type: String,
        },
        enddate: {
          type: String,
        },
        description: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

employeeSchema.plugin(mongoSequence(mongoose), { inc_field: "empid" });

module.exports = mongoose.model("Employee", employeeSchema);
