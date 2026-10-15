const mongoose = require('mongoose');

const annotationMaterialSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  teacherName: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  chapterNo: { type: String, required: true, trim: true },
  chapterName: { type: String, required: true, trim: true },
  topic: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  materialDate: { type: Date, default: Date.now },
  room: { type: String, required: true },
  periodId: { type: mongoose.Schema.Types.ObjectId, ref: 'PeriodAssignment', required: true, index: true },
  pages: [{
    pageNumber: { type: Number, required: true },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
    background: { type: String, enum: ['white', 'ruled', 'four-line', 'grid', 'dots'], default: 'white' }
  }],
  totalPages: { type: Number, default: 1 }
}, { timestamps: true });

annotationMaterialSchema.index({ teacher: 1, periodId: 1, createdAt: -1 });
module.exports = mongoose.models.AnnotationMaterial || mongoose.model('AnnotationMaterial', annotationMaterialSchema);
