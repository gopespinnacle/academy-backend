// =========================================================
// PUBLIC ASSESSMENT SUBJECT CATALOG
// Gopes Pinnacle Academy
// =========================================================
//
// CBSE / NCERT — Academic Session 2026-27
//
// IMPORTANT:
// This file defines the SUBJECT catalogue only.
// Chapter/concept data is maintained separately.
//
// Grade 3-8:
// - Subject availability can vary by school.
// - CT & AI is included as a curriculum area for III-VIII.
//
// Grade 9-10:
// - Uses the current CBSE 2026-27 secondary structure.
//
// Grade 11-12:
// - Includes academic, language and skill/elective subjects.
// - Subject-combination validation will be handled separately.
// =========================================================


module.exports = [

    // =====================================================
    // GRADES 3-5
    // =====================================================

    {
        grades: ["3", "4", "5"],
        subjects: [

            {
                name: "English",
                code: null,
                group: "LANGUAGE",
                type: "CORE",
                category: "LANGUAGE"
            },

            {
                name: "Hindi",
                code: null,
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "LANGUAGE"
            },

            {
                name: "Mathematics",
                code: null,
                group: "ACADEMIC",
                type: "CORE",
                category: "MATHEMATICS"
            },

            {
                name: "Environmental Studies",
                code: null,
                group: "ACADEMIC",
                type: "CORE",
                category: "EVS"
            },

            {
                name: "Science",
                code: null,
                group: "ACADEMIC",
                type: "ACADEMIC",
                category: "SCIENCE"
            },

            {
                name: "Social Science",
                code: null,
                group: "ACADEMIC",
                type: "ACADEMIC",
                category: "SOCIAL_SCIENCE"
            },

            {
                name: "Computer / Information Technology",
                code: null,
                group: "DIGITAL",
                type: "SCHOOL_LEVEL",
                category: "COMPUTER"
            },

            {
                name: "General Knowledge",
                code: null,
                group: "SCHOOL_LEVEL",
                type: "SCHOOL_LEVEL",
                category: "GENERAL_KNOWLEDGE"
            },

            {
                name: "Art Education",
                code: null,
                group: "ART",
                type: "SCHOOL_LEVEL",
                category: "ART"
            },

            {
                name: "Physical Education",
                code: null,
                group: "HEALTH",
                type: "SCHOOL_LEVEL",
                category: "PHYSICAL_EDUCATION"
            },

            {
                name: "Computational Thinking and Artificial Intelligence",
                code: null,
                group: "DIGITAL",
                type: "CBSE_FRAMEWORK",
                category: "CT_AI"
            }

        ]
    },


    // =====================================================
    // GRADES 6-8
    // =====================================================

    {
        grades: ["6", "7", "8"],
        subjects: [

            {
                name: "English",
                code: null,
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "LANGUAGE"
            },

            {
                name: "Hindi",
                code: null,
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "LANGUAGE"
            },

            {
                name: "Third Language",
                code: null,
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "LANGUAGE"
            },

            {
                name: "Mathematics",
                code: null,
                group: "ACADEMIC",
                type: "CORE",
                category: "MATHEMATICS"
            },

            {
                name: "Science",
                code: null,
                group: "ACADEMIC",
                type: "CORE",
                category: "SCIENCE"
            },

            {
                name: "Social Science",
                code: null,
                group: "ACADEMIC",
                type: "CORE",
                category: "SOCIAL_SCIENCE"
            },

            {
                name: "Computer Science",
                code: null,
                group: "DIGITAL",
                type: "SCHOOL_LEVEL",
                category: "COMPUTER"
            },

            {
                name: "Information Technology",
                code: null,
                group: "DIGITAL",
                type: "SCHOOL_LEVEL",
                category: "IT"
            },

            {
                name: "Computational Thinking and Artificial Intelligence",
                code: null,
                group: "DIGITAL",
                type: "CBSE_FRAMEWORK",
                category: "CT_AI"
            },

            {
                name: "Art Education",
                code: null,
                group: "ART",
                type: "CORE_AREA",
                category: "ART"
            },

            {
                name: "Health and Physical Education",
                code: null,
                group: "HEALTH",
                type: "CORE_AREA",
                category: "PHYSICAL_EDUCATION"
            },

            {
                name: "Kaushal Bodh / Skill Education",
                code: null,
                group: "SKILL",
                type: "VOCATIONAL",
                category: "SKILL_EDUCATION"
            },

            {
                name: "General Knowledge",
                code: null,
                group: "SCHOOL_LEVEL",
                type: "SCHOOL_LEVEL",
                category: "GENERAL_KNOWLEDGE"
            }

        ]
    },


    // =====================================================
    // GRADE 9
    // =====================================================

    {
        grades: ["9"],
        subjects: [

            {
                name: "English Language and Literature",
                code: "184",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "ENGLISH"
            },

            {
                name: "English Communicative",
                code: "101",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "ENGLISH"
            },

            {
                name: "Hindi Course A",
                code: "002",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "HINDI"
            },

            {
                name: "Hindi Course B",
                code: "085",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "HINDI"
            },

            {
                name: "Mathematics",
                code: "041",
                group: "ACADEMIC",
                type: "CORE",
                category: "MATHEMATICS"
            },

            {
                name: "Mathematics Advanced",
                code: null,
                group: "ACADEMIC",
                type: "CORE",
                category: "MATHEMATICS"
            },

            {
                name: "Science",
                code: "086",
                group: "ACADEMIC",
                type: "CORE",
                category: "SCIENCE"
            },

            {
                name: "Science Advanced",
                code: null,
                group: "ACADEMIC",
                type: "CORE",
                category: "SCIENCE"
            },

            {
                name: "Social Science",
                code: "087",
                group: "ACADEMIC",
                type: "CORE",
                category: "SOCIAL_SCIENCE"
            },

            {
                name: "Vocational Education / Kaushal Vikas",
                code: null,
                group: "SKILL",
                type: "COMPULSORY",
                category: "SKILL_EDUCATION"
            },

            {
                name: "Individuals in Society",
                code: null,
                group: "ACADEMIC",
                type: "CURRICULUM_AREA",
                category: "SOCIAL_SCIENCE"
            },

            {
                name: "Art Education",
                code: null,
                group: "ART",
                type: "INTERNAL_ASSESSMENT",
                category: "ART"
            },

            {
                name: "Physical Education and Well-being",
                code: null,
                group: "HEALTH",
                type: "INTERNAL_ASSESSMENT",
                category: "PHYSICAL_EDUCATION"
            },

            {
                name: "Computational Thinking and Artificial Intelligence",
                code: null,
                group: "DIGITAL",
                type: "COMPULSORY_MODULE",
                category: "CT_AI"
            },

            {
                name: "Optional Language 3",
                code: null,
                group: "LANGUAGE",
                type: "OPTIONAL",
                category: "LANGUAGE"
            }

        ]
    },


    // =====================================================
    // GRADE 10
    // =====================================================

    {
        grades: ["10"],
        subjects: [

            {
                name: "English Language and Literature",
                code: "184",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "ENGLISH"
            },

            {
                name: "English Communicative",
                code: "101",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "ENGLISH"
            },

            {
                name: "Hindi Course A",
                code: "002",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "HINDI"
            },

            {
                name: "Hindi Course B",
                code: "085",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "HINDI"
            },

            {
                name: "Mathematics Basic",
                code: "241",
                group: "ACADEMIC",
                type: "CORE",
                category: "MATHEMATICS"
            },

            {
                name: "Mathematics Standard",
                code: "041",
                group: "ACADEMIC",
                type: "CORE",
                category: "MATHEMATICS"
            },

            {
                name: "Science",
                code: "086",
                group: "ACADEMIC",
                type: "CORE",
                category: "SCIENCE"
            },

            {
                name: "Social Science",
                code: "087",
                group: "ACADEMIC",
                type: "CORE",
                category: "SOCIAL_SCIENCE"
            },

            {
                name: "Skill Subject",
                code: null,
                group: "SKILL",
                type: "OPTIONAL",
                category: "SKILL_EDUCATION"
            },

            {
                name: "Language 3",
                code: null,
                group: "LANGUAGE",
                type: "OPTIONAL",
                category: "LANGUAGE"
            },

            {
                name: "Art Education",
                code: null,
                group: "ART",
                type: "INTERNAL_ASSESSMENT",
                category: "ART"
            },

            {
                name: "Health and Physical Education",
                code: null,
                group: "HEALTH",
                type: "INTERNAL_ASSESSMENT",
                category: "PHYSICAL_EDUCATION"
            },

            {
                name: "Work Experience",
                code: null,
                group: "SKILL",
                type: "INTERNAL_ASSESSMENT",
                category: "WORK_EXPERIENCE"
            }

        ]
    },


    // =====================================================
    // GRADES 11-12
    // =====================================================

    {
        grades: ["11", "12"],
        subjects: [

            // -------------------------------------------------
            // LANGUAGES
            // -------------------------------------------------

            {
                name: "English Core",
                code: "301",
                group: "LANGUAGE",
                type: "CORE",
                category: "ENGLISH"
            },

            {
                name: "English Elective",
                code: "001",
                group: "LANGUAGE",
                type: "ELECTIVE",
                category: "ENGLISH"
            },

            {
                name: "Hindi Core",
                code: "302",
                group: "LANGUAGE",
                type: "CORE",
                category: "HINDI"
            },

            {
                name: "Hindi Elective",
                code: "002",
                group: "LANGUAGE",
                type: "ELECTIVE",
                category: "HINDI"
            },

            {
                name: "Sanskrit Core",
                code: "322",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "SANSKRIT"
            },

            {
                name: "Sanskrit Elective",
                code: "022",
                group: "LANGUAGE",
                type: "ELECTIVE",
                category: "SANSKRIT"
            },

            {
                name: "Urdu Core",
                code: "303",
                group: "LANGUAGE",
                type: "LANGUAGE",
                category: "URDU"
            },

            {
                name: "Urdu Elective",
                code: "003",
                group: "LANGUAGE",
                type: "ELECTIVE",
                category: "URDU"
            },

            // -------------------------------------------------
            // MATHEMATICS
            // -------------------------------------------------

            {
                name: "Mathematics",
                code: "041",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "MATHEMATICS"
            },

            {
                name: "Applied Mathematics",
                code: "241",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "MATHEMATICS"
            },

            // -------------------------------------------------
            // SCIENCE
            // -------------------------------------------------

            {
                name: "Physics",
                code: "042",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "PHYSICS"
            },

            {
                name: "Chemistry",
                code: "043",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "CHEMISTRY"
            },

            {
                name: "Biology",
                code: "044",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "BIOLOGY"
            },

            // -------------------------------------------------
            // COMMERCE
            // -------------------------------------------------

            {
                name: "Accountancy",
                code: "055",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "COMMERCE"
            },

            {
                name: "Business Studies",
                code: "054",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "COMMERCE"
            },

            {
                name: "Economics",
                code: "030",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "ECONOMICS"
            },

            {
                name: "Business Administration",
                code: "833",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "BUSINESS"
            },

            // -------------------------------------------------
            // HUMANITIES / SOCIAL SCIENCES
            // -------------------------------------------------

            {
                name: "History",
                code: "027",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "HUMANITIES"
            },

            {
                name: "Political Science",
                code: "028",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "HUMANITIES"
            },

            {
                name: "Geography",
                code: "029",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "HUMANITIES"
            },

            {
                name: "Sociology",
                code: "039",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "HUMANITIES"
            },

            {
                name: "Psychology",
                code: "037",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "HUMANITIES"
            },

            {
                name: "Legal Studies",
                code: "074",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "LAW"
            },

            {
                name: "Philosophy",
                code: "027",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "HUMANITIES"
            },

            // -------------------------------------------------
            // COMPUTER / INFORMATION TECHNOLOGY
            // -------------------------------------------------

            {
                name: "Computer Science",
                code: "083",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "COMPUTER"
            },

            {
                name: "Informatics Practices",
                code: "065",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "COMPUTER"
            },

            {
                name: "Information Technology",
                code: "802",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "IT"
            },

            {
                name: "Web Application",
                code: "803",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "WEB"
            },

            // -------------------------------------------------
            // PSYCHOLOGY / HOME SCIENCE / FINE ARTS
            // -------------------------------------------------

            {
                name: "Home Science",
                code: "064",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "HOME_SCIENCE"
            },

            {
                name: "Fine Arts",
                code: null,
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "FINE_ARTS"
            },

            {
                name: "Painting",
                code: "049",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "FINE_ARTS"
            },

            {
                name: "Graphic Design",
                code: "050",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "FINE_ARTS"
            },

            // -------------------------------------------------
            // PHYSICAL EDUCATION
            // -------------------------------------------------

            {
                name: "Physical Education",
                code: "048",
                group: "ACADEMIC",
                type: "ACADEMIC_ELECTIVE",
                category: "PHYSICAL_EDUCATION"
            },

            // -------------------------------------------------
            // SKILL / VOCATIONAL
            // -------------------------------------------------

            {
                name: "Retail",
                code: "801",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "RETAIL"
            },

            {
                name: "Tourism",
                code: "806",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "TOURISM"
            },

            {
                name: "Banking Financial Services and Insurance",
                code: "805",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "BANKING"
            },

            {
                name: "Marketing and Sales",
                code: "812",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "MARKETING"
            },

            {
                name: "Health Care",
                code: "813",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "HEALTHCARE"
            },

            {
                name: "Beauty and Wellness",
                code: "807",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "BEAUTY_WELLNESS"
            },

            {
                name: "Agriculture",
                code: "808",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "AGRICULTURE"
            },

            {
                name: "Food Production",
                code: "809",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "FOOD_PRODUCTION"
            },

            {
                name: "Front Office Operations",
                code: "810",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "HOSPITALITY"
            },

            {
                name: "Introduction to Financial Markets",
                code: "825",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "FINANCE"
            },

            {
                name: "Artificial Intelligence",
                code: "843",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "ARTIFICIAL_INTELLIGENCE"
            },

            {
                name: "Data Science",
                code: "844",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "DATA_SCIENCE"
            },

            {
                name: "Design Thinking and Innovation",
                code: "833",
                group: "SKILL",
                type: "SKILL_ELECTIVE",
                category: "DESIGN_THINKING"
            },

            // -------------------------------------------------
            // INTERNAL / GENERAL AREAS
            // -------------------------------------------------

            {
                name: "Health and Physical Education",
                code: null,
                group: "INTERNAL_ASSESSMENT",
                type: "INTERNAL",
                category: "HEALTH"
            },

            {
                name: "Work Experience",
                code: null,
                group: "INTERNAL_ASSESSMENT",
                type: "INTERNAL",
                category: "WORK_EXPERIENCE"
            },

            {
                name: "General Studies",
                code: null,
                group: "INTERNAL_ASSESSMENT",
                type: "INTERNAL",
                category: "GENERAL_STUDIES"
            }

        ]
    }

];