// const Employee = require("../model/employeeModel");
// const EmployeeDetail = require("../model/employeeDetailsModel");

// const { validationResult } = require("express-validator");

// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");

// const { sendMail } = require("../helpers/mailer");

// const generateAccessToken = (employee) => {
//   const token = jwt.sign(employee, process.env.ACCESS_TOKEN, {
//     expiresIn: "10h",
//   });
//   return token;
// };

// const registerEmployee = async (req, res) => {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(200).json({
//         success: false,
//         msg: "Errors",
//         errors: errors.array(),
//       });
//     }

//     const { name, email, password, phone } = req.body;

//     const isExistEmployee = await Employee.findOne({ email }).populate("eid");

//     if (isExistEmployee) {
//       return res.status(200).json({
//         success: false,
//         msg: "Email already exist",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);

//     const employee = new Employee({
//       empid,
//       name,
//       email,
//       password: hashedPassword,
//       phone,
//     });

//     const employeeData = await employee.save();
//     return res.status(200).json({
//       success: true,
//       msg: "New Employee Registered successfully",
//       data: employeeData,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       msg: error.message,
//     });
//   }
// };

// const loginEmployee = async (req, res) => {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(200).json({
//         success: false,
//         msg: "Errors",
//         errors: errors.array(),
//       });
//     }

//     const { email, password } = req.body;

//     const employeeData = await Employee.findOne({ email });

//     if (!employeeData) {
//       return res.status(400).json({
//         success: false,
//         msg: "Invalid Email And Password",
//       });
//     }

//     // Check if the employee is inactive (status === 0)
//     if (employeeData.status === 0) {
//       return res.status(400).json({
//         success: false,
//         msg: "Your account is inactive, please contact admin.",
//       });
//     }

//     const isPasswordMatch = await bcrypt.compare(
//       password,
//       employeeData.password
//     );

//     if (!isPasswordMatch) {
//       return res.status(400).json({
//         success: false,
//         msg: "Invalid Email And Password",
//       });
//     }

//     const asscessToken = generateAccessToken({ employee: employeeData });

//     const empdata = { asscessToken, employeeData };

//     return res.status(200).json({
//       success: true,
//       msg: "Login Successfully",
//       accessToken: asscessToken,
//       usertype: employeeData.auth,
//       tokenType: "Bearer",
//       data: empdata,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       msg: error.message,
//     });
//   }
// };

// const getProfile = async (req, res) => {
//   const employee_Id = req.employee.empid;
//   const employeeData = await Employee.findOne({ empid: employee_Id }).populate(
//     "employeedetails"
//   );

//   try {
//     return res.status(200).json({
//       success: true,
//       msg: "Profile Data",
//       data: employeeData,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       msg: error.message,
//     });
//   }
// };

// const deleteEmployee = async (req, res) => {
//   try {
//     const { id } = req.body;

//     // Check if the employee exists
//     const employee = await Employee.findById(id);
//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         msg: "Employee not found",
//       });
//     }

//     // Delete the employee
//     await Employee.findByIdAndDelete(id);

//     return res.status(200).json({
//       success: true,
//       msg: "Employee deleted successfully",
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       msg: error.message,
//     });
//   }
// };

// const employeedetails = async (req, res) => {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(200).json({
//         success: false,
//         msg: "Errors",
//         errors: errors.array(),
//       });
//     }

//     const {
//       eid,
//       dob,
//       gender,
//       maritialstatus,
//       bloodgroup,
//       dateofjoining,
//       desiganation,
//       department,
//       reportingto,
//       teamleader,
//       techexperties,
//       address,
//       city,
//       state,
//       country,
//       zipcode,
//       emergencypersonname,
//       relation,
//       profession,
//       emergencypersonaddress,
//       emergencypersonemail,
//       emergencypersonphone,
//       jobtitle,
//       companyname,
//       companylinkedinurl,
//       employeementtype,
//       startdate,
//       enddate,
//       description,
//       adharcard,
//       pancard,
//       addressproof,
//       electricitybil,
//       previousorgofferlatter,
//       previousorgexperiencelatter,
//       payslip1,
//       payslip2,
//       payslip3,
//     } = req.body;

//     const isExistEmployeeDetails = await EmployeeDetail.findOne({
//       eid,
//     }).populate("empid");

//     if (isExistEmployeeDetails) {
//       return res.status(200).json({
//         success: false,
//         msg: "Employee details already exist",
//       });
//     }

//     const employeeetail = new EmployeeDetail({
//       eid,
//       dob,
//       gender,
//       maritialstatus,
//       bloodgroup,
//       dateofjoining,
//       desiganation,
//       department,
//       reportingto,
//       teamleader,
//       techexperties,
//       address,
//       city,
//       state,
//       country,
//       zipcode,
//       emergencypersonname,
//       relation,
//       profession,
//       emergencypersonaddress,
//       emergencypersonemail,
//       emergencypersonphone,
//       jobtitle,
//       companyname,
//       companylinkedinurl,
//       employeementtype,
//       startdate,
//       enddate,
//       description,
//       adharcard,
//       pancard,
//       addressproof,
//       electricitybil,
//       previousorgofferlatter,
//       previousorgexperiencelatter,
//       payslip1,
//       payslip2,
//       payslip3,
//     });

//     const employeeDetailData = await employeeetail.save();
//     return res.status(200).json({
//       success: true,
//       msg: "New Employee Details Added successfully",
//       data: employeeDetailData,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       msg: error.message,
//     });
//   }
// };

// const updateemployeebyadmin = async (req, res) => {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         msg: "Validation errors",
//         errors: errors.array(),
//       });
//     }

//     const {
//       _id,
//       name,
//       email,
//       password,
//       phone,
//       status,
//       auth,
//       dob,
//       gender,
//       maritialstatus,
//       bloodgroup,
//       dateofjoining,
//       designation,
//       department,
//       reportingto,
//       teamleader,
//       techexperties,
//       address,
//       city,
//       state,
//       country,
//       zipcode,
//       emergencypersonname,
//       relation,
//       profession,
//       emergencypersonaddress,
//       emergencypersonemail,
//       emergencypersonphone,
//       workexperience,
//     } = req.body;

//     const isExist = await Employee.findOne({ _id: _id });

//     if (!isExist) {
//       return res.status(400).json({
//         success: false,
//         msg: "Employee not Exist",
//       });
//     }

//     var updateObj = {
//       name,
//       email,
//       password,
//       phone,
//       status,
//       auth,
//       _id,
//       name,
//       password,
//       phone,
//       status,
//       dob,
//       gender,
//       maritialstatus,
//       bloodgroup,
//       dateofjoining,
//       designation,
//       department,
//       reportingto,
//       teamleader,
//       techexperties,
//       address,
//       city,
//       state,
//       country,
//       zipcode,
//       emergencypersonname,
//       relation,
//       profession,
//       emergencypersonaddress,
//       emergencypersonemail,
//       emergencypersonphone,
//       workexperience,
//     };

//     const newPassword = req.body.password;
//     if (newPassword) {
//       const hashPassword = await bcrypt.hash(newPassword, 12);
//       updateObj.password = hashPassword;
//     }

//     // if (req.body.status != updateObj.status) {
//     //   updateObj.status = req.body.status;
//     // }

//     // Update last working day logic based on status
//     if (req.body.status === 0) {
//       const today = new Date();
//       updateObj.lastwd = today.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"
//     } else if (req.body.status === 1) {
//       updateObj.lastwd = null; // Remove lastwd
//     }

//     const updatedEmployeeData = await Employee.findByIdAndUpdate(
//       { _id: _id },
//       {
//         $set: updateObj,
//       },
//       { new: true }
//     );

//     const mailContent = `
//   <div style="font-family: Arial, sans-serif; max-width: 600px;  padding: 20px 5px; background-color: #f9f9f9; color: #333; line-height: 1.6; border-radius: 8px;">
//     <!-- Header -->
//     <div style="text-align: center; padding: 10px 0; border-bottom: 1px solid #ddd;">
//       <h1 style="margin: 0; font-size: 1.5rem; color: #3b82f6;">Invezza HRMS Account Updated</h1>
//     </div>
//     <!-- Body -->
//     <div style="padding: 20px;">
//       <p style="margin: 0; font-size: 1rem;">
//         Hello <strong style="color: #3b82f6;">${updatedEmployeeData.name}</strong>,
//       </p>
//       <p style="margin: 10px 0; font-size: 1rem; color: #555;">
//         Hope you are doing well.
//       </p>
//       <p style="margin: 10px 0 20px; font-size: 1rem; color: #555;">
//         Your Invezza HRMS portal account details have been updated successfully by the admin. Here are your new account details:
//       </p>
//       <div style="padding: 15px; background-color: white; border-left: 4px solid #3b82f6; border-radius: 6px;">
//         <div style="display: flex; align-items: center; margin-bottom: 10px;">
//           <span style="width: 7rem; font-weight: bold;">Employee ID</span>
//           <span>- ${updatedEmployeeData.empid}</span>
//         </div>
//         <div style="display: flex; align-items: center; margin-bottom: 10px;">
//           <span style="width: 7rem; font-weight: bold;">Username</span>
//           <span>- ${updatedEmployeeData.name}</span>
//         </div>
//         <div style="display: flex; align-items: center; margin-bottom: 10px;">
//           <span style="width: 7rem; font-weight: bold;">Email</span>
//           <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">- ${updatedEmployeeData.email}</span>
//         </div>
//       </div>
//       <p style="margin: 20px 0; color: red; font-weight: bold;">
//         Note: Please never share your password with anyone.
//       </p>
//     </div>
//     <!-- Footer -->
//     <div style="padding: 20px; border-top: 1px solid #ddd; margin-top: 20px;">
//       <p style="margin: 0; font-size: 1rem; color: #333;"><strong>Best Regards,</strong></p>
//       <div style="margin-top: 10px; display: flex;">
//         <img src="https://res.cloudinary.com/shubshinde/image/upload/v1736494352/mhnnpoz5qv5d1xx0mf27.png" alt="Company Logo" style="width: 80px; margin-bottom: 10px;" />
//         <div style="margin-left: 10px;">
//           <p style="margin: 0; font-size: 1rem; color: #333;"><strong>HR Team Invezza</strong></p>
//           <p style="margin: 5px 0 0; font-size: 0.9rem; color: #555;">"Empowering Your Workplace"</p>
//         </div>
//       </div>
//     </div>
//   </div>`;

//     sendMail(
//       updatedEmployeeData.email,
//       `Invezza HRMS Portal Account Details Updated`,
//       mailContent
//     );

//     return res.status(200).json({
//       success: true,
//       msg: "Employee Details Updated successfully",
//       data: updatedEmployeeData,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       msg: error.message,
//     });
//   }
// };

// module.exports = {
//   registerEmployee,
//   loginEmployee,
//   getProfile,
//   deleteEmployee,
//   employeedetails,
//   updateemployeebyadmin,
// };










const Employee = require("../model/employeeModel");
const EmployeeDetail = require("../model/employeeDetailsModel");
const Otp = require("../model/otpModel");
const { sendLog } = require('../controllers/admin/settingController');

const { validationResult } = require("express-validator");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { sendMail } = require("../helpers/mailer");

/**
 * Generates a JWT access token
 * @param {Object} employee 
 * @returns {string} JWT access token
 */
// TODO (dev) - Change the expiry time for logout
const generateAccessToken = (employee) => {
  const token = jwt.sign(employee, process.env.ACCESS_TOKEN, {
    expiresIn: "10h",
  });
  return token;
};

const registerEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(200).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { name, email, password, phone } = req.body;

    const isExistEmployee = await Employee.findOne({ email }).populate("eid");

    if (isExistEmployee) {
      return res.status(200).json({
        success: false,
        msg: "Email already exist",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const employee = new Employee({
      empid,
      name,
      email,
      password: hashedPassword,
      phone,
    });

    const employeeData = await employee.save();
    return res.status(200).json({
      success: true,
      msg: "New Employee Registered successfully",
      data: employeeData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

// api endpoint: `${ApiendPonits.baseUrl}${ApiendPonits.endpoints.login}`,
const loginEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(200).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const employeeData = await Employee.findOne({ email });

    if (!employeeData) {
      return res.status(400).json({
        success: false,
        msg: "Invalid Email And Password",
      });
    }

    // Check if the employee is inactive (status === 0)
    if (employeeData.status === 0) {
      return res.status(400).json({
        success: false,
        msg: "Your account is inactive, please contact admin.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      employeeData.password
    );

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        msg: "Invalid Email And Password",
      });
    }

    // Generate OTP (6-digit code)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    //const otp = "000000"; // TODO (dev) - Change to above line for prod
    const otpExpiry = new Date(Date.now() + 3 * 60 * 1000); // OTP valid for 3 minutes

    // Remove existing OTP if any
    await Otp.deleteOne({ email });

    // Save OTP in OTP collection
    const newOtp = new Otp({ email, otp, otpExpiry });
    await newOtp.save();

    sendLog(`${email} requested login code`, "info")


    const emailBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px 10px; background-color: #f9f9f9; color: #333; line-height: 1.6; border-radius: 6px;">
    <!-- Header -->
    <div style="text-align: center; padding: 10px 0; border-bottom: 1px solid #ddd;">
      <h1 style="margin: 0; font-size: 1.5rem; color: #3b82f6;">Account Verification Code</h1>
    </div>
    <!-- Body -->
    <div style="padding: 20px;">
      <p style="margin: 0; font-size: 1rem;">
        Hello <strong style="color: #3b82f6;">${employeeData.name}</strong>,
      </p>
      <p style="margin: 10px 0 20px; font-size: 1rem; color: #555;">
        Please use the verification code below to complete the login process
      </p>
      <div style="padding: 15px; background-color: white; border-left: 4px solid #3b82f6; border-radius: 6px; text-align: center;">
        <p style="margin: 10px 0; font-size: 2.5rem; font-weight: bold; color: #333;">
          ${otp}
        </p>
        <p style="margin: 10px 0; font-size: 1rem; color: #777;">
          This code is valid until <strong>${otpExpiry}</strong> (3 minutes).
        </p>
      </div>
      <p style="margin-top: 20px; color: #555; font-size: 1rem;">
        If you did not request this, please ignore this email.
      </p>
    </div>
    <!-- Footer -->
    <div style="padding: 20px; border-top: 1px solid #ddd; margin-top: 20px;">
      <p style="margin: 0; font-size: 1rem; color: #333;"><strong>Best Regards,</strong></p>
      <div style="margin-top: 10px; display: flex;">
        <img src="https://res.cloudinary.com/shubshinde/image/upload/v1736494352/mhnnpoz5qv5d1xx0mf27.png" alt="Company Logo" style="width: 80px; margin-bottom: 10px;" />
        <div style="margin-left: 10px;">
          <p style="margin: 0; font-size: 1rem; color: #333;"><strong>Team Invezza</strong></p>
          <p style="margin: 5px 0 0; font-size: 0.9rem; color: #555;">"Empowering Your Workplace"</p>
        </div>
      </div>
    </div>
  </div>`;

// TODO (dev) - Uncomment to enable sending email
    await sendMail(
      email,
      `Invezza HRMS Portal - Account Verification Code`,
      emailBody
    );



    // const asscessToken = generateAccessToken({ employee: employeeData });

    // const empdata = { asscessToken, employeeData };

    // return res.status(200).json({
    //   success: true,
    //   msg: "Login Successfully",
    //   accessToken: asscessToken,
    //   usertype: employeeData.auth,
    //   tokenType: "Bearer",
    //   data: empdata,
    // });

    return res.status(200).json({
      success: true,
      msg: "Code sent to your email. Please verify to proceed.",
      email: employeeData.email,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

// api endpoint: http://localhost:3000/api/loginstep2
const verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email });

    // OTP not found.
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        msg: "Please request a new Code.",
      });
    }

    // Check if OTP is expired
    if (otpRecord.otpExpiry < new Date()) {
      await Otp.deleteOne({ email });
      return res.status(400).json({
        success: false,
        msg: "Code expired, please request a new one.",
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        msg: "Invalid code please use correct one",
      });
    }

    // Delete OTP after successful verification
    await Otp.deleteOne({ email });

    // Generate access token after successful verification
    const employeeData = await Employee.findOne({ email });

    // const accessToken = generateAccessToken({ employee: employeeData });
    // const empdata = { accessToken, employeeData };

    // return res.status(200).json({
    //   success: true,
    //   msg: "Login successful",
    //   accessToken: accessToken,
    //   usertype: employeeData.auth,
    //   tokenType: "Bearer",
    //   data: empdata,



    const asscessToken = generateAccessToken({ employee: employeeData });

    const empdata = { asscessToken, employeeData };

    sendLog(`${email} succesfully logged in`, "info")

    return res.status(200).json({
      success: true,
      msg: "Login Successfully",
      accessToken: asscessToken,
      usertype: employeeData.auth,
      tokenType: "Bearer",
      data: empdata,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  const employee_Id = req.employee.empid;
  const employeeData = await Employee.findOne({ empid: employee_Id }).populate(
    "employeedetails"
  );

  try {
    return res.status(200).json({
      success: true,
      msg: "Profile Data",
      data: employeeData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.body;

    // Check if the employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        msg: "Employee not found",
      });
    }

    // Delete the employee
    await Employee.findByIdAndDelete(id);

    sendLog(`${id} employee deleted`, "info")

    return res.status(200).json({
      success: true,
      msg: "Employee deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const employeedetails = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(200).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const {
      eid,
      dob,
      gender,
      maritialstatus,
      bloodgroup,
      dateofjoining,
      desiganation,
      department,
      reportingto,
      teamleader,
      techexperties,
      address,
      city,
      state,
      country,
      zipcode,
      emergencypersonname,
      relation,
      profession,
      emergencypersonaddress,
      emergencypersonemail,
      emergencypersonphone,
      jobtitle,
      companyname,
      companylinkedinurl,
      employeementtype,
      startdate,
      enddate,
      description,
      adharcard,
      pancard,
      addressproof,
      electricitybil,
      previousorgofferlatter,
      previousorgexperiencelatter,
      payslip1,
      payslip2,
      payslip3,
    } = req.body;

    const isExistEmployeeDetails = await EmployeeDetail.findOne({
      eid,
    }).populate("empid");

    if (isExistEmployeeDetails) {
      return res.status(200).json({
        success: false,
        msg: "Employee details already exist",
      });
    }

    const employeeetail = new EmployeeDetail({
      eid,
      dob,
      gender,
      maritialstatus,
      bloodgroup,
      dateofjoining,
      desiganation,
      department,
      reportingto,
      teamleader,
      techexperties,
      address,
      city,
      state,
      country,
      zipcode,
      emergencypersonname,
      relation,
      profession,
      emergencypersonaddress,
      emergencypersonemail,
      emergencypersonphone,
      jobtitle,
      companyname,
      companylinkedinurl,
      employeementtype,
      startdate,
      enddate,
      description,
      adharcard,
      pancard,
      addressproof,
      electricitybil,
      previousorgofferlatter,
      previousorgexperiencelatter,
      payslip1,
      payslip2,
      payslip3,
    });

    const employeeDetailData = await employeeetail.save();
    return res.status(200).json({
      success: true,
      msg: "New Employee Details Added successfully",
      data: employeeDetailData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const updateemployeebyadmin = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array(),
      });
    }

    const {
      _id,
      empid,
      name,
      email,
      password,
      phone,
      status,
      auth,
      dob,
      gender,
      maritialstatus,
      bloodgroup,
      dateofjoining,
      lastwd,
      designation,
      department,
      reportingto,
      teamleader,
      techexperties,
      address,
      city,
      state,
      country,
      zipcode,
      emergencypersonname,
      relation,
      profession,
      emergencypersonaddress,
      emergencypersonemail,
      emergencypersonphone,
      workexperience,
    } = req.body;

    const isExist = await Employee.findOne({ _id: _id });

    if (!isExist) {
      return res.status(400).json({
        success: false,
        msg: "Employee not Exist",
      });
    }

    var updateObj = {
      name,
      email,
      password,
      phone,
      status,
      auth,
      _id,
      empid,
      name,
      password,
      phone,
      status,
      dob,
      gender,
      maritialstatus,
      bloodgroup,
      dateofjoining,
      lastwd,
      designation,
      department,
      reportingto,
      teamleader,
      techexperties,
      address,
      city,
      state,
      country,
      zipcode,
      emergencypersonname,
      relation,
      profession,
      emergencypersonaddress,
      emergencypersonemail,
      emergencypersonphone,
      workexperience,
    };

    const newPassword = req.body.password;
    if (newPassword) {
      const hashPassword = await bcrypt.hash(newPassword, 12);
      updateObj.password = hashPassword;
    }

    // if (req.body.status != updateObj.status) {
    //   updateObj.status = req.body.status;
    // }

    // Update last working day logic based on status
    if (updateObj.lastwd === null) {
      if (req.body.status === 0) {
        const today = new Date();
        updateObj.lastwd = today.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"
      }
    }

    if (req.body.status === 1) {
      updateObj.lastwd = null; // Remove lastwd
    }


    const updatedEmployeeData = await Employee.findByIdAndUpdate(
      { _id: _id },
      {
        $set: updateObj,
      },
      { new: true }
    );

    const mailContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px;  padding: 20px 5px; background-color: #f9f9f9; color: #333; line-height: 1.6; border-radius: 8px;">
    <!-- Header -->
    <div style="text-align: center; padding: 10px 0; border-bottom: 1px solid #ddd;">
      <h1 style="margin: 0; font-size: 1.5rem; color: #3b82f6;">Invezza HRMS Account Updated</h1>
    </div>
    <!-- Body -->
    <div style="padding: 20px;">
      <p style="margin: 0; font-size: 1rem;">
        Hello <strong style="color: #3b82f6;">${updatedEmployeeData.name}</strong>,
      </p>
      <p style="margin: 10px 0; font-size: 1rem; color: #555;">
        Hope you are doing well.
      </p>
      <p style="margin: 10px 0 20px; font-size: 1rem; color: #555;">
        Your Invezza HRMS portal account details have been updated successfully by the admin. Here are your new account details:
      </p>
      <div style="padding: 15px; background-color: white; border-left: 4px solid #3b82f6; border-radius: 6px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="width: 7rem; font-weight: bold;">Employee ID</span>
          <span>- ${updatedEmployeeData.empid}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="width: 7rem; font-weight: bold;">Username</span>
          <span>- ${updatedEmployeeData.name}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="width: 7rem; font-weight: bold;">Email</span>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">- ${updatedEmployeeData.email}</span>
        </div>
      </div>
      <p style="margin: 20px 0; color: red; font-weight: bold;">
        Note: Please never share your password with anyone.
      </p>
    </div>
    <!-- Footer -->
    <div style="padding: 20px; border-top: 1px solid #ddd; margin-top: 20px;">
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
// TODO (dev) - Uncomment to enable sending email
    sendMail(
      updatedEmployeeData.email,
      `Invezza HRMS Portal Account Details Updated`,
      mailContent
    );

    sendLog(`${updatedEmployeeData.name} details updated by admin`, "info")


    return res.status(200).json({
      success: true,
      msg: "Employee Details Updated successfully",
      data: updatedEmployeeData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

module.exports = {
  registerEmployee,
  loginEmployee,
  getProfile,
  deleteEmployee,
  employeedetails,
  updateemployeebyadmin,
  verifyotp,
};
