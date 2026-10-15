/* Authenticated annotation-material routes. This router verifies the same Bearer JWT used by the existing APIs. */
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const router = express.Router();
const AnnotationMaterial = require('../models/AnnotationMaterial');
const PeriodAssignment = require('../models/PeriodAssignment');

// server.js mounts this router without a global req.user middleware, so verify the existing JWT here.
router.use((req, res, next) => {
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in again. Your login token is missing.' });
  if (!process.env.JWT_SECRET) {
    console.error('ANNOTATION MATERIALS: JWT_SECRET is not configured.');
    return res.status(500).json({ success: false, message: 'Authentication is not configured on the server.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const nested = decoded.user && typeof decoded.user === 'object' ? decoded.user : {};
    req.user = {
      ...nested,
      ...decoded,
      _id: decoded._id || decoded.id || decoded.userId || decoded.teacherId || decoded.sub || nested._id || nested.id || nested.userId,
      role: decoded.role || nested.role,
      name: decoded.name || decoded.fullName || nested.name || nested.fullName
    };
    if (!req.user._id || !req.user.role) return res.status(401).json({ success: false, message: 'Your login token does not contain a user ID and role. Please sign in again.' });
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Your login session has expired or is invalid. Please sign in again.' });
  }
});

function currentUser(req) { return req.user || req.authUser || null; }
function userIdOf(user) { return user && (user._id || user.id || user.userId); }
function sameId(a, b) { return !!a && !!b && String(a) === String(b); }
function normalizeGrade(value) {
  const s = String(value || '').trim();
  const m = s.match(/^Grade[\s-]*(\d+)$/i);
  return m ? `Grade-${m[1]}` : (/^\d+$/.test(s) ? `Grade-${s}` : s.toLowerCase());
}
function getPeriodTeacherIds(period) {
  const ids = [period && period.teacher, period && period.teacherId, period && period.assignedTeacher, period && period.assignedTeacherId];
  for (const a of (period && Array.isArray(period.assignments) ? period.assignments : [])) {
    if (a && (a.teacher || a.teacherId || a.assignedTeacher || a.assignedTeacherId)) ids.push(a.teacher || a.teacherId || a.assignedTeacher || a.assignedTeacherId);
  }
  return ids.filter(Boolean).map(String);
}
function getPeriodStudentIds(period) {
  const ids = [];
  for (const a of (period && Array.isArray(period.assignments) ? period.assignments : [])) {
    if (a && a.student) ids.push(a.student._id || a.student);
    if (a && a.studentId) ids.push(a.studentId._id || a.studentId);
    if (a && Array.isArray(a.students)) a.students.forEach(s => ids.push(s && (s._id || s.studentId || s)));
  }
  if (period && Array.isArray(period.students)) period.students.forEach(s => ids.push(s && (s._id || s.studentId || s)));
  return ids.filter(Boolean).map(String);
}
async function requirePeriodTeacher(periodId, teacherId) {
  if (!mongoose.Types.ObjectId.isValid(String(periodId))) throw Object.assign(new Error('A valid assigned period is required.'), { status: 400 });
  const period = await PeriodAssignment.findById(periodId).lean();
  if (!period) throw Object.assign(new Error('The assigned period was not found.'), { status: 404 });
  const teacherIds = getPeriodTeacherIds(period);
  if (!teacherIds.length || !teacherIds.includes(String(teacherId))) {
    throw Object.assign(new Error('This period is not mapped to the logged-in teacher. Please reopen the material from your assigned period.'), { status: 403 });
  }
  return period;
}
function formatPages(pages, backgrounds) {
  const safe = Array.isArray(pages) ? pages : [];
  return safe.map((item, index) => {
    const history = Array.isArray(item) ? item : (item && Array.isArray(item.history) ? item.history : []);
    const background = (item && item.background) || (Array.isArray(backgrounds) && backgrounds[index]) || 'white';
    const validBackground = ['white', 'ruled', 'four-line', 'grid', 'dots'].includes(background) ? background : 'white';
    return { pageNumber: index + 1, history, background: validBackground };
  });
}
function materialPayload(body, teacherId, teacherName, periodId) {
  const pages = formatPages(body.pages, body.pageBackgrounds);
  return {
    teacher: teacherId,
    teacherName: teacherName || body.teacherName || 'Teacher',
    className: String(body.className || '').trim(),
    subject: String(body.subject || 'General').trim(),
    chapterNo: String(body.chapterNo || body.chapterNumber || '1').trim(),
    chapterName: String(body.chapterName || body.topic || 'Learning Material').trim(),
    topic: String(body.topic || 'General').trim(),
    description: String(body.description || ''),
    materialDate: body.materialDate || new Date(),
    room: String(body.room || `period-${periodId}`),
    periodId,
    pages,
    totalPages: Math.max(pages.length, 1)
  };
}

// Save or update the logged-in teacher's material. Never trust teacher ID from the browser.
router.post('/', async (req, res) => {
  try {
    const user = currentUser(req); const teacherId = userIdOf(user);
    if (!user || !teacherId || String(user.role || '').toLowerCase() !== 'teacher') return res.status(401).json({ success: false, message: 'Teacher login is required.' });
    const periodId = req.body.periodId;
    const period = await requirePeriodTeacher(periodId, teacherId);
    const data = materialPayload(req.body, teacherId, user.name || user.fullName || req.body.teacherName, period._id);
    if (!data.className) data.className = String(period.className || period.grade || period.class || '');
    if (!data.className || !data.subject || !data.topic) return res.status(400).json({ success: false, message: 'Class, subject, and topic are required.' });
    const material = await AnnotationMaterial.create(data);
    return res.status(201).json({ success: true, message: 'Learning material saved.', material });
  } catch (e) { console.error('ANNOTATION MATERIAL CREATE:', e); return res.status(e.status || 500).json({ success: false, message: e.status ? e.message : 'Failed to save learning material.' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const user = currentUser(req); const teacherId = userIdOf(user);
    if (!user || !teacherId || String(user.role || '').toLowerCase() !== 'teacher') return res.status(401).json({ success: false, message: 'Teacher login is required.' });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid material ID.' });
    const existing = await AnnotationMaterial.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Learning material not found.' });
    if (!sameId(existing.teacher, teacherId)) return res.status(403).json({ success: false, message: 'You cannot edit another teacher’s material.' });
    await requirePeriodTeacher(existing.periodId, teacherId);
    const body = { ...existing.toObject(), ...req.body, periodId: existing.periodId };
    const data = materialPayload(body, teacherId, existing.teacherName, existing.periodId);
    const material = await AnnotationMaterial.findByIdAndUpdate(existing._id, data, { new: true, runValidators: true });
    return res.json({ success: true, message: 'Learning material updated.', material });
  } catch (e) { console.error('ANNOTATION MATERIAL UPDATE:', e); return res.status(e.status || 500).json({ success: false, message: e.status ? e.message : 'Failed to update learning material.' }); }
});

// Role-scoped listing endpoint for teacher-materials.html and student-materials.html.
router.get('/mine', async (req, res) => {
  try {
    const user = currentUser(req); const id = userIdOf(user); const role = String(user && user.role || '').toLowerCase();
    if (!user || !id) return res.status(401).json({ success: false, message: 'Please sign in again.' });
    let materials = [];
    if (role === 'teacher') {
      materials = await AnnotationMaterial.find({ teacher: id }).sort({ materialDate: -1, createdAt: -1 }).lean();
    } else if (role === 'student') {
      const assignments = await PeriodAssignment.find({ 'assignments.student': id }).select('_id assignments').lean();
      const allowedPeriodIds = assignments.filter(p => getPeriodStudentIds(p).includes(String(id))).map(p => p._id);
      materials = await AnnotationMaterial.find({ periodId: { $in: allowedPeriodIds } }).sort({ materialDate: -1, createdAt: -1 }).lean();
    } else {
      return res.status(403).json({ success: false, message: 'This page is only available to assigned teachers and students.' });
    }
    return res.json({ success: true, materials });
  } catch (e) { console.error('ANNOTATION MATERIAL LIST:', e); return res.status(500).json({ success: false, message: 'Failed to load learning materials.' }); }
});

// Detail retrieval is also permission-checked; frontend hiding alone is not security.
router.get('/:id', async (req, res) => {
  try {
    const user = currentUser(req); const id = userIdOf(user); const role = String(user && user.role || '').toLowerCase();
    if (!user || !id) return res.status(401).json({ success: false, message: 'Please sign in again.' });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid material ID.' });
    const material = await AnnotationMaterial.findById(req.params.id).lean();
    if (!material) return res.status(404).json({ success: false, message: 'Learning material not found.' });
    let allowed = role === 'teacher' && sameId(material.teacher, id);
    if (role === 'student') {
      const assignment = await PeriodAssignment.findOne({ _id: material.periodId, 'assignments.student': id }).lean();
      allowed = !!assignment && getPeriodStudentIds(assignment).includes(String(id));
    }
    if (!allowed) return res.status(403).json({ success: false, message: 'You are not assigned to this learning material.' });
    return res.json({ success: true, material });
  } catch (e) { console.error('ANNOTATION MATERIAL DETAIL:', e); return res.status(500).json({ success: false, message: 'Failed to load learning material.' }); }
});

module.exports = router;
