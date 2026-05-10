const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
{
   performedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      role: String
   },

   actionType: {
      type: String,
      enum: [
         "MARK_UPDATE",
         "STUDENT_DELETE",
         "FEE_EDIT",
         "MEETING_GENERATE",
         "LOGIN",
         "FAILED_LOGIN"
      ]
   },

   target: {
      targetId: mongoose.Schema.Types.ObjectId,
      targetName: String,
      targetType: String
   },

   oldValue: mongoose.Schema.Types.Mixed,
   newValue: mongoose.Schema.Types.Mixed,

   ipAddress: String,
   device: String,

   severity: {
      type: String,
      enum: ["normal", "warning", "critical"],
      default: "normal"
   }
},
{ timestamps: true }
);

// INDEXES (IMPORTANT FOR LARGE DATA)
auditLogSchema.index({ actionType: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ "performedBy.userId": 1 });
auditLogSchema.index({ severity: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);