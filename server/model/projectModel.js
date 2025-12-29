const mongoose = require("mongoose");
const mongoSequence = require("mongoose-sequence");

const projectSchema = new mongoose.Schema(
  {
    clientid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    projectname: {
      type: String,
      require: true,
    },
    description: {
      type: String,
    },
    technologies: {
      type: String,
    },
    reciveddate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: Number,
      default: 0,
    },
    isdeleted: {
      type: Boolean,
      default: false,
    },
    assignto: [
      {
        type: mongoose.Schema.Types.ObjectId, //employee model object reference to realtion
        ref: "Employee",
      }
    ],
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true, 
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.plugin(mongoSequence(mongoose), { inc_field: "projectid" });

module.exports = mongoose.model("Project", projectSchema);
