const { validationResult } = require("express-validator");
const Employee = require("../model/employeeModel");
const EmployeeProfile = require("../model/employeeProfile");
const { sendLog } = require('../controllers/admin/settingController');
const mongoose = require("mongoose");

const Upload = require("../helpers/upload");
const Employeeprofile = require("../model/employeeProfile");
const Project = require("../model/projectModel");

const PasswordReset = require("../model/passwordReset");

const bcrypt = require("bcrypt");
const randomstring = require("randomstring");

const { sendMail } = require("../helpers/mailer");

const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, email, phone } = req.body;

    const isExist = await Employee.findOne({ email });

    if (isExist) {
      sendLog(`${email} this email is already exist`, "error")
      return res.status(400).json({
        success: false,
        msg: "Email is Already Exist",
      });
    }

    // TODO (dev) - Change password for prod
    const rowpassword = randomstring.generate(10);
    //const rowpassword = "TomHardy@12";

    const hashPassword = await bcrypt.hash(rowpassword, 12);

    var obj = {
      name,
      email,
      phone,
      password: hashPassword,
    };

    if (req.body.auth && req.body.auth == 1) {
      return res.status(400).json({
        success: false,
        msg: "You have not permission to create admin account",
      });
    } else if (req.body.auth) {
      obj.auth = req.body.auth;
    }

    const employee = new Employee(obj);
    const EmployeeData = await employee.save();

    const mailContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px;  padding: 20px 10px; background-color: #f9f9f9; color: #333; line-height: 1.6; border-radius: 8px;">
    <!-- Header -->
    <div style="text-align: center; padding: 10px 0; border-bottom: 1px solid #ddd;">
      <h1 style="margin: 0; font-size: 1.5rem; color: #3b82f6;">Welcome to Invezza HRMS</h1>
    </div>
    <!-- Body -->
    <div style="padding: 20px;">
      <p style="margin: 0; font-size: 1rem;">
        Hello <strong style="color: #3b82f6;">${EmployeeData.name}</strong>,
      </p>
      <p style="margin: 10px 0; font-size: 1rem; color: #555;">
        Hope you are doing well.
      </p>
      <p style="margin: 10px 0 20px; font-size: 1rem; color: #555;">
        Your Invezza HRMS portal account has been created successfully! Below are your account details:
      </p>
      <div style="padding: 15px; background-color: white; border-left: 4px solid #3b82f6; border-radius: 6px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="width: 7rem; font-weight: bold;">Employee ID</span>
          <span>- ${EmployeeData.empid}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="width: 7rem; font-weight: bold;">Username</span>
          <span>- ${EmployeeData.name}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="width: 7rem; font-weight: bold;">Email</span>
          <span>- ${EmployeeData.email}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="width: 7rem; font-weight: bold;">Password</span>
          <span>- ${rowpassword}</span>
        </div>
      </div>
      <p style="margin: 20px 0; color: red; font-weight: bold;">
        Note: Please change your password after your first login. Never share your password with anyone.
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
      EmployeeData.email,
      `Invezza HRMS Portal Account Created`,
      mailContent
    );

    sendLog(`new account created for ${EmployeeData.email}`, "info")


    return res.status(200).json({
      success: true,
      msg: "User Created Successfully",
      data: EmployeeData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(200).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    const userData = await Employee.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email id does not exist!..",
      });
    }

    const randonString = randomstring.generate();

    const msg = `
  <div style="font-family: Arial, sans-serif; max-width: 600px;  padding: 20px 10px; background-color: #f9f9f9; color: #333; line-height: 1.6; border-radius: 6px;">
    <!-- Header -->
    <div style="text-align: center; padding: 10px 0; border-bottom: 1px solid #ddd;">
      <h1 style="margin: 0; font-size: 1.5rem; color: #3b82f6;">Password Reset Request</h1>
    </div>
    <!-- Body -->
    <div style="padding: 20px;">
      <p style="margin: 0; font-size: 1rem;">
        Hello <strong style="color: #3b82f6;">${userData.name}</strong>,
      </p>
      <p style="margin: 10px 0 20px; font-size: 1rem; color: #555;">
        We hope this message finds you well. You have requested to reset your password for the Invezza HRMS Portal. Please click the link below to proceed with resetting your password:
      </p>
      <div style="padding: 15px; background-color: white; border-left: 4px solid #3b82f6; border-radius: 6px;">
        <p style="margin: 10px 0; font-size: 1rem; color: #333;">
          <a href="${process.env.REACT_APP_API_URL}/api/resetpassword?token=${randonString}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Click here to reset your password</a>
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
          <p style="margin: 0; font-size: 1rem; color: #333;"><strong>HR Team Invezza</strong></p>
          <p style="margin: 5px 0 0; font-size: 0.9rem; color: #555;">"Empowering Your Workplace"</p>
        </div>
      </div>
    </div>
  </div>`;

    await PasswordReset.deleteMany({ emp_id: userData._id });

    const passwordReset = new PasswordReset({
      emp_id: userData._id,
      token: randonString,
    });

    await passwordReset.save();

    sendMail(userData.email, "Reset Password", msg);

    return res.status(200).json({
      success: true,
      msg: "Reset password link send to your mail",
      data: userData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    if (req.query.token == undefined) {
      return res.render("400");
    }

    const resetData = await PasswordReset.findOne({ token: req.query.token });

    if (!resetData) {
      return res.render("404");
    }

    return res.render("resetpassword", {
      resetData,
    });
  } catch (error) {
    return res.render("404");
    // .json({
    //   success: false,
    //   msg: error.message,
    // });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { emp_id, password, confirmpassword } = req.body;

    const resetData = await PasswordReset.findOne({ emp_id });

    console.log(resetData);

    if (password != confirmpassword) {
      return res.render("resetpassword", {
        resetData,
        error: "Confirm password Not match",
      });
    }

    const newHashedPassword = await bcrypt.hash(confirmpassword, 12);

    await Employee.findByIdAndUpdate(
      { _id: emp_id },
      {
        $set: {
          password: newHashedPassword,
        },
      }
    );

    await PasswordReset.deleteMany({ emp_id });

    return res.render("resetsuccess");
  } catch (error) {
    return res.render("404");
  }
};

const viewUser = async (req, res) => {
  try {
    const employesDatas = await Employee.find({
      // _id: {
      //   $ne: req.employee._id,
      // },
      // auth: {
      //   $nin: [1],
      // },
    });

    // Map through employees to add their profile URL
    const employesData = await Promise.all(
      employesDatas.map(async (employee) => {
        const profile = await EmployeeProfile.findOne({
          employee_id: employee._id.toString(),
        });

        return {
          ...employee.toObject(),
          profileUrl: profile ? profile.profileUrl : null, // Add profileUrl or null if not found
        };
      })
    );

    return res.status(200).json({
      success: true,
      msg: "Employees Fetched successfully",
      data: employesData,
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
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array(),
      });
    }
    const { _id } = req.body;

    const empdetails = await Employee.findOne({ _id });
    if (!empdetails) {
      return res.status(400).json({
        success: false,
        msg: "Employee not Exist",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Employee details fetch successfully",
      data: empdetails,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Unable to fetch Employee details",
      data: empdetails,
    });
  }
};

const updateUser = async (req, res) => {
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
      id,
      name,
      password,
      phone,
      status,
      dob,
      gender,
      maritialstatus,
      bloodgroup,
      dateofjoining,
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

    const isExist = await Employee.findOne({ _id: id });

    if (!isExist) {
      return res.status(400).json({
        success: false,
        msg: "Employee not Exist",
      });
    }

    var updateObj = {
      name,
      password,
      phone,
      status,
      id,
      name,
      password,
      phone,
      status,
      dob,
      gender,
      maritialstatus,
      bloodgroup,
      dateofjoining,
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

    // if (req.body.auth != 1) {
    //   updateObj.auth = req.body.auth;
    // }

    const newPassword = req.body.password;
    if (newPassword) {
      const hashPassword = await bcrypt.hash(newPassword, 12);
      updateObj.password = hashPassword;
    }

    if (req.body.status != updateObj.status) {
      updateObj.status = req.body.status;
    }

    const updatedEmployeeData = await Employee.findByIdAndUpdate(
      { _id: id },
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
        Your Invezza HRMS portal account details have been updated successfully! Here are your new account details:
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
        <div style="display: flex; align-items: center;">
          <span style="width: 7rem; font-weight: bold;">Password</span>
          <span>- **********</span>
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
// TODO (dev) - Uncomment this for prod
    sendMail(
      updatedEmployeeData.email,
      `Invezza HRMS Portal Account Details Updated`,
      mailContent
    );

    sendLog(`Details updated for ${updatedEmployeeData.email}`, "info")


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

const deleteUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array(),
      });
    }

    const { id } = req.body;

    const isExist = await Employee.findOne({ _id: id });

    if (!isExist) {
      return res.status(400).json({
        success: false,
        msg: "Employee not Exist",
      });
    }

    const updatedEmployeeData = await Employee.findByIdAndDelete({ _id: id });

    return res.status(200).json({
      success: true,
      msg: "Employee Delete successfully",
      data: updatedEmployeeData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

// http://localhost:3000/api/uploadprofile
const uploadFile = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array(),
      });
    }
    const { Employee_id } = req.body;

    const isExist = await Employee.findOne({ _id: Employee_id });

    if (!isExist) {
      return res.status(400).json({
        success: false,
        msg: "Employee not found",
      });
    }

    const existingprofile = await Employeeprofile.findOne({
      employee_id: Employee_id,
    });

    if (existingprofile) {
      return res.status(400).json({
        success: false,
        msg: "Employee already have profile",
      });
    }

    const upload = await Upload.uploadFile(req.file.path);

    await Employee.findOneAndUpdate(
      { _id: Employee_id },
      { $set: { profile: upload.secure_url } },
      { new: true } // Ensures you get the updated document back
    );

    var employeeprofile = new Employeeprofile({
      profileUrl: upload.secure_url,
      employee_id: Employee_id,
    });
    var record = await employeeprofile.save();

    return res.status(200).json({
      success: true,
      msg: "File Uploded",
      data: record,
    });
    // res.send({ success: true, msg: "File Uploded", data: record });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

// http://localhost:3000/api/deleteprofile
const deleteProfile = async (req, res) => {
  try {
    const { Employee_id } = req.body;

    // Check if the employee exists
    const isExist = await Employee.findOne({ _id: Employee_id });

    if (!isExist) {
      return res.status(400).json({
        success: false,
        msg: "Employee not found",
      });
    }

    // Check if the profile exists
    const existingprofile = await Employeeprofile.findOne({
      employee_id: Employee_id,
    });

    if (!existingprofile) {
      return res.status(400).json({
        success: false,
        msg: "Profile not found to delete",
      });
    }

    // Delete the profile
    await Employeeprofile.deleteOne({ employee_id: Employee_id });

    await Employee.updateOne(
      { _id: Employee_id },
      { $unset: { profile: "" } } // Removes the profile field
    );

    return res.status(200).json({
      success: true,
      msg: "Profile deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

// http://localhost:3000/api/updateprofile
const updateProfile = async (req, res) => {
  try {
    const { Employee_id } = req.body;

    // Check if the employee exists
    const isExist = await Employee.findOne({ _id: Employee_id });

    if (!isExist) {
      return res.status(400).json({
        success: false,
        msg: "Employee not found",
      });
    }

    // Check if the profile exists
    const existingprofile = await Employeeprofile.findOne({
      employee_id: Employee_id,
    });

    if (!existingprofile) {
      return res.status(400).json({
        success: false,
        msg: "Delete old profile",
      });
    }

    // Upload new file
    const upload = await Upload.uploadFile(req.file.path);

    // Update the profile with the new URL
    existingprofile.profileUrl = upload.secure_url;

    // Save the updated profile
    var updatedRecord = await existingprofile.save();

    return res.status(200).json({
      success: true,
      msg: "Profile updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

// http://localhost:3000/api/viewprofile
const viewProfilePic = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation errors",
        errors: errors.array(),
      });
    }

    const { Employee_id } = req.body;

    const isExist = await Employeeprofile.findOne({ employee_id: Employee_id });

    // if (!isExist) {
    //   return res.status(400).json({
    //     success: false,
    //     msg: "Employee not found",
    //   });
    // }

    // Check if the profile exists
    const existingprofile = await Employeeprofile.findOne({
      employee_id: Employee_id,
    });

    if (!existingprofile) {
      return res.status(400).json({
        success: false,
        msg: "Employee profile not found",
      });
    }

    // Return the profile data
    return res.status(200).json({
      success: true,
      msg: "Profile retrieved successfully",
      data: existingprofile,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

/**
 * Retrieves all unique team members assigned to projects
 * managed by the authenticated manager (from JWT).
 *
 * Flow:
 * 1. Gets managerId from req.employee.
 * 2. Fetches projects managed by the manager.
 * 3. Collects unique employee IDs from `assignto` arrays.
 * 4. Removes managerId from the list.
 * 5. Fetches employee details and merges profile data.
 *
 * Responses:
 * - 200 → { success: true, data: Employee[] }
 * - 400 → Manager not found or unexpected error
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const viewTeam = async (req, res) => {
  try {
    // Get manager ID from authenticated user
    let managerId = req.employee?._id ?? null;
    
    // Return empty data if managerId not found
    if (!managerId) {
      return res.status(400).json({ success: false, msg: "Manager ID not found", data: [] });
    }

    // Get all projects where managerId matches
    const projects = await Project.find({ managerId }).select('assignto').lean();
    

    // If no projects found for the given managerId then return empty data
    if (!projects || projects.length === 0) {
      return res.status(200).json({ success: true, msg: "No projects found for manager", data: [] });
    }

    // Collect all assignTo ids from projects
    const allAssignIds = projects.reduce((acc, p) => {
      if (Array.isArray(p.assignto)) acc.push(...p.assignto.map(id => id?.toString()));
      return acc;
    }, []);

    // Removing managerId from the assignTo ids
    const uniqueAssignIds = Array.from(new Set(allAssignIds)).filter(id => id !== managerId.toString());

    // If no team members found after removing managerId
    if (uniqueAssignIds.length === 0) {
      return res.status(200).json({ success: true, msg: "No team members found", data: [] });
    }

    // Fetch all employees data
    const employees = await Employee.find({ _id: { $in: uniqueAssignIds } }).lean();


    const profiles = await Employeeprofile.find({ employee_id: { $in: uniqueAssignIds } }).lean();

    // Constructing a map of employee_id to profile for quick lookup
    const profileMap = profiles.reduce((m, p) => {
      const key = p.employee_id?.toString?.() ?? p.employee_id;
      if (key) m[key] = p;
      return m;
    }, {});

    // Merging the profile URLs into employee data
    const result = employees.map(emp => {
      const idStr = emp._id.toString();
      const p = profileMap[idStr];
      return {
        ...emp,
        profileUrl: p ? p.profileUrl : null,
      };
    });

    return res.status(200).json({
      success: true,
      msg: "Employees Fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
}

/**
 * Queries the Employee document to check for auth value and decides based on it whether the user is admin(1) or HR(2)
 * @param {ObjectId of mongoose} managerId 
 * @returns Boolean. True = The given ID is an admin or HR. False = Not admin or HR or error.
 */
const isAdminOrHR = async (managerId) => {
  const employee = await Employee.findOne({
    _id: managerId,
    auth: { $in: [1, 2] }
  }).lean();

  return !!employee;
};



/**
 * Checks whether the given employeeId belongs to any project
 * managed by the authenticated manager (from JWT).
 *
 * Flow:
 * 1. Validates managerId from token and employeeId from request body.
 * 2. Ensures both are valid MongoDB ObjectIds.
 * 3. Fetches projects where managerId matches.
 * 4. Returns true if employeeId exists in any project's `assignto` array.
 *
 * Responses:
 * - 200 → { isMember: true | false }
 * - 400 → Invalid or missing employeeId
 * - 401 → Authentication/managerId missing or invalid
 * - 403 → Employee not part of manager's team
 * - 500 → Server error
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const checkMembership = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const managerId = req.employee?._id ?? null;
    
    console.log("=== Membership Check Started ===");
    console.log("Employee ID from request:", employeeId);
    console.log("Manager ID from token:", managerId);

    // Validate managerId
    if (!managerId) {
      console.log("ERROR: Manager ID not found in token");
      return res.status(401).json({ 
        isMember: false, 
        message: "Authentication required. Manager ID not found." 
      });
    }

    // Validate employeeId
    if (!employeeId) {
      console.log("ERROR: Employee ID missing in request body");
      return res.status(400).json({ 
        isMember: false, 
        message: "Employee ID is required" 
      });
    }

    // Validate that employeeId is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      console.log("ERROR: Invalid employee ID format:", employeeId);
      return res.status(400).json({ 
        isMember: false, 
        message: "Invalid employee ID format" 
      });
    }

    // Validate that managerId is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      console.log("ERROR: Invalid manager ID format:", managerId);
      return res.status(401).json({ 
        isMember: false, 
        message: "Invalid manager ID in token" 
      });
    }

    // Step 0: Check if the managerId is actually a admin or HR by querying employees field (employees.auth field)
    const privileged = await isAdminOrHR(managerId);

    if (privileged) {
      return res.status(200).json({ isMember: true });
    }

    // Step 1 & 2: Query projects where the user is the manager
    const projects = await Project.find({ 
      managerId: new mongoose.Types.ObjectId(managerId) 
    });

    console.log("Projects found:", projects.length);
    
    // If no projects found, the employee cannot be a member
    if (!projects || projects.length === 0) {
      console.log("No projects found for manager:", managerId);
      return res.status(200).json({ isMember: false });
    }

    // Debug: Log project details
    projects.forEach((project, index) => {
      console.log(`Project ${index + 1}:`, {
        id: project._id,
        name: project.name || 'N/A',
        assignto: project.assignto,
        assigntoType: Array.isArray(project.assignto) ? 'array' : typeof project.assignto,
        assignToLength: project.assignto?.length || 0
      });
    });

    // Step 3: Check if employeeId exists in assignTo field of any project
    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);
    
    const isMember = projects.some(project => {
      // Safety check: ensure assignTo exists and is an array
      if (!project.assignto || !Array.isArray(project.assignto)) {
        console.log(`WARNING: Project ${project._id} has invalid assignTo field:`, project.assignto);
        return false;
      }

      // Check if employeeId exists in this project's assignTo array
      const found = project.assignto.some(assignedId => {
        // Additional safety check for assignedId
        if (!assignedId) {
          console.log(`WARNING: Null/undefined assignedId in project ${project._id}`);
          return false;
        }
        
        // Convert to ObjectId if it's a string
        const assignedObjectId = typeof assignedId === 'string' 
          ? new mongoose.Types.ObjectId(assignedId)
          : assignedId;
        
        return assignedObjectId.equals(employeeObjectId);
      });

      if (found) {
        console.log(`Employee ${employeeId} found in project:`, project._id);
      }

      return found;
    });

    console.log("Final membership result:", isMember);
    console.log("=== Membership Check Completed ===");

    if (isMember) {
      return res.status(200).json({ isMember: true });
    } else {
      // Access rights violated - employee exists but not in manager's team
      console.log("Access denied: Employee not found in any project");
      return res.status(403).json({ 
        isMember: false, 
        message: "Access denied. Employee is not a member of your team." 
      });
    }

  } catch (error) {
    console.error("=== Membership Check Error ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Step 4: Handle any other errors
    return res.status(500).json({ 
      isMember: false, 
      message: "An error occurred while checking membership" 
    });
  }
};



module.exports = {
  createUser,
  forgotPassword,
  viewUser,
  updateUser,
  deleteUser,
  resetPassword,
  // resetSuccess,
  updatePassword,
  uploadFile,
  deleteProfile,
  updateProfile,
  viewProfilePic,
  employeedetails,
  viewTeam,
  checkMembership
};
