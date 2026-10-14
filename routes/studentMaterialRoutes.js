
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const PeriodAssignment = require("../models/PeriodAssignment");
const StudentMaterial = require("../models/StudentMaterial");
const { uploadFile, deleteFile } = require("../config/s3");

const {
    S3Client,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const allowedMimeTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "image/jpeg",
    "image/png"
]);

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(
                new Error("Unsupported file type. Upload PDF, Office documents, TXT, JPG or PNG.")
            );
        }

        cb(null, true);
    }
});

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function safeFileName(name) {
    return String(name || "document")
        .replace(/[\\\/:*?"<>|\x00-\x1F]/g, "_")
        .replace(/\s+/g, "_")
        .slice(0, 150);
}

async function getStudentPeriods(studentId) {
    return PeriodAssignment.find({
        "assignments.student": studentId
    }).populate([
        { path: "teacher", select: "name teacherId role" },
        { path: "assistantTeacher", select: "name teacherId role" }
    ]);
}

function teacherMatchesPeriod(teacherId, period) {
    return (
        String(period.teacher?._id || period.teacher) === String(teacherId) ||
        String(period.assistantTeacher?._id || period.assistantTeacher) === String(teacherId)
    );
}

async function studentCanUseTeacher(studentId, teacherId, subject) {
    const periods = await PeriodAssignment.find({
        "assignments.student": studentId
    });

    return periods.some(period => {
        if (!teacherMatchesPeriod(teacherId, period)) {
            return false;
        }

        const assignment = period.assignments.find(
            item => String(item.student) === String(studentId)
        );

        if (!assignment) {
            return false;
        }

        const allowedSubjects = [
            period.subject,
            ...(assignment.subjects || [])
        ]
            .filter(Boolean)
            .map(value => String(value).trim().toLowerCase());

        return allowedSubjects.includes(String(subject).trim().toLowerCase());
    });
}

function canAccessMaterial(user, material) {
    if (user.role === "founder") {
        return true;
    }

    if (user.role === "student") {
        return String(material.student) === String(user._id);
    }

    if (user.role === "teacher") {
        return String(material.teacher) === String(user._id);
    }

    return false;
}

/* =====================================================
   GET TEACHERS ASSIGNED TO THE LOGGED-IN STUDENT
   GET /api/student-materials/teachers
===================================================== */

router.get("/teachers", protect, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can access this teacher list."
            });
        }

        const periods = await getStudentPeriods(req.user._id);
        const teacherMap = new Map();

        for (const period of periods) {
            for (const teacher of [period.teacher, period.assistantTeacher]) {
                if (!teacher || teacher.role !== "teacher") {
                    continue;
                }

                const id = String(teacher._id);

                if (!teacherMap.has(id)) {
                    teacherMap.set(id, {
                        _id: id,
                        name: teacher.name,
                        teacherId: teacher.teacherId || "",
                        subjects: []
                    });
                }

                const assignment = period.assignments.find(
                    item => String(item.student) === String(req.user._id)
                );

                const subjects = [
                    period.subject,
                    ...(assignment?.subjects || [])
                ].filter(Boolean);

                for (const subject of subjects) {
                    const cleaned = String(subject).trim();
                    if (
                        cleaned &&
                        !teacherMap.get(id).subjects.some(
                            existing => existing.toLowerCase() === cleaned.toLowerCase()
                        )
                    ) {
                        teacherMap.get(id).subjects.push(cleaned);
                    }
                }
            }
        }

        return res.json({
            success: true,
            teachers: Array.from(teacherMap.values())
        });
    } catch (error) {
        console.error("Student material teacher list error:", error);
        return res.status(500).json({
            message: "Unable to load assigned teachers."
        });
    }
});

/* =====================================================
   UPLOAD A STUDENT MATERIAL
   POST /api/student-materials/upload
===================================================== */

router.post(
    "/upload",
    protect,
    (req, res, next) => {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can upload materials."
            });
        }

        next();
    },
    (req, res, next) => {
        upload.single("file")(req, res, error => {
            if (error) {
                return res.status(400).json({
                    message: error.message || "File upload failed."
                });
            }

            next();
        });
    },
    async (req, res) => {
        let uploadedKey = null;

        try {
            const { teacherId, subject, chapter } = req.body;

            if (!teacherId || !isValidId(teacherId)) {
                return res.status(400).json({
                    message: "Please select a valid teacher."
                });
            }

            if (
                typeof subject !== "string" ||
                !subject.trim() ||
                typeof chapter !== "string" ||
                !chapter.trim()
            ) {
                return res.status(400).json({
                    message: "Subject and chapter are required."
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: "Please select a document to upload."
                });
            }

            const allowed = await studentCanUseTeacher(
                req.user._id,
                teacherId,
                subject
            );

            if (!allowed) {
                return res.status(403).json({
                    message: "This teacher or subject is not assigned to you."
                });
            }

            const safeName = safeFileName(req.file.originalname);

            const fileForS3 = {
                ...req.file,
                originalname: safeName
            };

            const s3Result = await uploadFile(
                fileForS3,
                "student-materials"
            );

            uploadedKey = s3Result.Key;

            const material = await StudentMaterial.create({
                student: req.user._id,
                teacher: teacherId,
                subject: subject.trim(),
                chapter: chapter.trim(),
                originalFileName: safeName,
                fileKey: s3Result.Key,
                mimeType: req.file.mimetype,
                fileSize: req.file.size
            });

            return res.status(201).json({
                success: true,
                message: "Material uploaded successfully.",
                material: {
                    _id: material._id,
                    subject: material.subject,
                    chapter: material.chapter,
                    originalFileName: material.originalFileName,
                    fileSize: material.fileSize,
                    createdAt: material.createdAt
                }
            });
        } catch (error) {
            if (uploadedKey) {
                try {
                    await deleteFile(uploadedKey);
                } catch (cleanupError) {
                    console.error(
                        "Student material S3 cleanup error:",
                        cleanupError.message
                    );
                }
            }

            console.error("Student material upload error:", error);
            return res.status(500).json({
                message: "Unable to upload the material."
            });
        }
    }
);

/* =====================================================
   LIST MATERIALS VISIBLE TO THE LOGGED-IN USER
   GET /api/student-materials
===================================================== */

router.get("/", protect, async (req, res) => {
    try {
        let filter;

        if (req.user.role === "student") {
            filter = { student: req.user._id };
        } else if (req.user.role === "teacher") {
            filter = { teacher: req.user._id };
        } else if (req.user.role === "founder") {
            filter = {};
        } else {
            return res.status(403).json({
                message: "You are not allowed to view student materials."
            });
        }

        const materials = await StudentMaterial.find(filter)
            .populate("student", "name studentId")
            .populate("teacher", "name teacherId")
            .select("-fileKey")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            materials
        });
    } catch (error) {
        console.error("Student material list error:", error);
        return res.status(500).json({
            message: "Unable to load student materials."
        });
    }
});

/* =====================================================
   CREATE A TEMPORARY DOWNLOAD LINK
   GET /api/student-materials/:id/download
===================================================== */

router.get("/:id/download", protect, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid material ID."
            });
        }

        const material = await StudentMaterial.findById(req.params.id);

        if (!material) {
            return res.status(404).json({
                message: "Material not found."
            });
        }

        if (!canAccessMaterial(req.user, material)) {
            return res.status(403).json({
                message: "You are not allowed to download this material."
            });
        }

        const downloadUrl = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET,
                Key: material.fileKey,
                ResponseContentDisposition:
                    `attachment; filename="${safeFileName(material.originalFileName)}"`
            }),
            { expiresIn: 60 }
        );

        return res.json({
            success: true,
            downloadUrl
        });
    } catch (error) {
        console.error("Student material download error:", error);
        return res.status(500).json({
            message: "Unable to create a download link."
        });
    }
});

/* =====================================================
   DELETE A STUDENT'S OWN MATERIAL
   DELETE /api/student-materials/:id
===================================================== */

router.delete("/:id", protect, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid material ID."
            });
        }

        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only the uploading student can delete this material."
            });
        }

        const material = await StudentMaterial.findById(req.params.id);

        if (!material) {
            return res.status(404).json({
                message: "Material not found."
            });
        }

        if (String(material.student) !== String(req.user._id)) {
            return res.status(403).json({
                message: "You can delete only your own materials."
            });
        }

        await deleteFile(material.fileKey);
        await material.deleteOne();

        return res.json({
            success: true,
            message: "Material deleted successfully."
        });
    } catch (error) {
        console.error("Student material delete error:", error);
        return res.status(500).json({
            message: "Unable to delete the material."
        });
    }
});

module.exports = router;
