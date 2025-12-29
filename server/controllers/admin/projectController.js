const Project = require("../../model/projectModel");

const { validationResult } = require("express-validator");

const addProject = async (req, res) => {
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
      projectname,
      clientid,
      description,
      technologies,
      reciveddate,
      deadline,
      status,
      assignto,
      managerId
    } = req.body;

    const isExist = await Project.findOne({ projectname });

    if (isExist) {
      return res.status(400).json({
        success: false,
        msg: "Use Different Project Name",
      });
    }

    const newProjectData = new Project({
      projectname,
      clientid,
      description,
      technologies,
      reciveddate,
      deadline,
      status,
      assignto: Array.isArray(assignto) ? assignto : [assignto],
      managerId
    });

    const projectData = await newProjectData.save();

    return res.status(200).json({
      success: true,
      msg: "New Project Added Successfully",
      data: projectData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const updateProject = async (req, res) => {
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
      projectname,
      clientid,
      description,
      technologies,
      reciveddate,
      deadline,
      status,
      assignto,
      managerId,
    } = req.body;

    const isExist = await Project.findOne({ _id: id });

    if (!isExist) {
      return res.status(400).json({
        success: false,
        msg: "Project is not Exist",
      });
    }

    const updateProjectData = await Project.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          projectname,
          clientid,
          description,
          technologies,
          reciveddate,
          deadline,
          status,
          assignto: Array.isArray(assignto) ? assignto : [assignto],
          managerId,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      msg: "Project data Updated Successfully",
      data: updateProjectData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const viewPorject = async (req, res) => {
  try {
    const ProjectData = await Project.find({}).populate("clientid assignto");

    return res.status(200).json({
      success: true,
      msg: "Project Fetched successfully",
      data: ProjectData,
    });
  } catch (error) {
    console.error("Error saving Project:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to add Project data",
      error: error.message,
    });
  }
};

const viewProjectById = async (req, res) => {
  try {
    // Extract projectid from the request body
    const { projectid } = req.body;

    if (!projectid) {
      return res.status(400).json({
        success: false,
        msg: "Project ID is required",
      });
    }

    // Fetch the specific project details
    const projectData = await Project.findOne({ _id: projectid }).populate(
      "clientid assignto"
    );

    if (!projectData) {
      return res.status(404).json({
        success: false,
        msg: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Project fetched successfully",
      data: projectData,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to fetch project data",
      error: error.message,
    });
  }
};

const viewProjectsByClient = async (req, res) => {
  const { clientid } = req.body; // Get clientid from request body

  if (!clientid) {
    return res.status(400).json({
      success: false,
      msg: "Client ID is required",
    });
  }

  try {
    // Find projects where the clientid matches the provided one
    const projects = await Project.find({ clientid })
      .populate("clientid")
      .populate("assignto");

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No projects found for this client",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Projects fetched successfully",
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to fetch project data",
      error: error.message,
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectid } = req.body;

    if (!projectid) {
      return res.status(400).json({
        success: false,
        msg: "Project ID is required for delete",
      });
    }

    const projectData = await Project.findOne({ _id: projectid });

    if (!projectData) {
      return res.status(404).json({
        success: false,
        msg: "Project not found",
      });
    }

    await Project.deleteOne({ _id: projectid });

    return res.status(200).json({
      success: true,
      msg: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to delete project",
      error: error.message,
    });
  }
};

const softdeleteproject = async (req, res) => {
  try {
    const { projectid } = req.body;

    if (!projectid) {
      return res.status(400).json({
        success: false,
        msg: "Project ID is required",
      });
    }

    // Fetch the project data
    const project = await Project.findOne({ _id: projectid }); // Use `.lean()` to return a plain JavaScript object

    if (!project) {
      return res.status(404).json({
        success: false,
        msg: "Project not found",
      });
    }

    if (project.isdeleted) {
      return res.status(400).json({
        success: false,
        msg: "Project is already deleted",
      });
    }

    // Set isdeleted = true
    await Project.updateOne({ _id: projectid }, { isdeleted: true });

    res.status(200).json({
      success: true,
      msg: "Project has been soft deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "An error occurred while soft deleting the project",
      error: error.message,
    });
  }
};

module.exports = {
  addProject,
  viewPorject,
  updateProject,
  viewProjectsByClient,
  viewProjectById,
  deleteProject,
  softdeleteproject,
};
