const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  className: String,
  subject: String,
  day: String,
  startTime: String,
  endTime: String,
  meetingLink: String,
  date: String // YYYY-MM-DD
});

module.exports = mongoose.model("Session", sessionSchema);