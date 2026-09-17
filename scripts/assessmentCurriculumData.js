/*
=========================================================
GOPES PINNACLE ACADEMY
PUBLIC ASSESSMENT
MASTER CURRICULUM DATA

STEP 5B
CBSE → NCERT → 2026-27 → GRADE 3

Subjects currently loaded:
1. Our Wondrous World
2. Mathematics — Maths Mela

Verified textbook structure:
NCERT Class 3 Mathematics — Maths Mela
14 chapters
=========================================================
*/


/* =========================================================
   CURRICULUM RECORD BUILDER
========================================================= */

function curriculumRecord({
    board,
    curriculum,
    academicYear = "2026-27",
    grade,
    subject,
    splitUp,
    chapterNumber,
    chapterName,
    concepts = [],
    active = true
}) {
    return {
        board,
        curriculum,
        academicYear,
        grade: String(grade),
        subject,
        splitUp,
        chapterNumber,
        chapterName,
        concepts,
        active
    };
}


/* =========================================================
   CBSE → NCERT → GRADE 3
   OUR WONDROUS WORLD
========================================================= */

const CBSE_GRADE_3_OUR_WONDROUS_WORLD = [

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Our Wondrous World",
        splitUp: "Unit 1 — Our Community",
        chapterNumber: 1,
        chapterName: "Living Together",

        concepts: [
            {
                name: "Community",
                topics: [
                    "People and places in a community",
                    "Living together",
                    "Interdependence",
                    "Sense of belonging"
                ]
            },
            {
                name: "Public Places",
                topics: [
                    "Schools",
                    "Markets",
                    "Playgrounds",
                    "Roads",
                    "Health centres",
                    "Police stations"
                ]
            },
            {
                name: "Community Cooperation",
                topics: [
                    "Working together",
                    "Sharing responsibilities",
                    "Mutual help",
                    "Community participation"
                ]
            },
            {
                name: "People at Work",
                topics: [
                    "Different occupations",
                    "Community helpers",
                    "Tools used for work",
                    "Skills required for work"
                ]
            },
            {
                name: "School as a Community",
                topics: [
                    "People working in a school",
                    "Roles of teachers",
                    "Roles of students",
                    "Support staff",
                    "Teamwork"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Our Wondrous World",
        splitUp: "Unit 1 — Our Community",
        chapterNumber: 2,
        chapterName: "Exploring Our Neighbourhood",

        concepts: [
            {
                name: "Transportation",
                topics: [
                    "Modes of transport",
                    "Movement of people",
                    "Movement of goods"
                ]
            },
            {
                name: "Communication",
                topics: [
                    "Modes of communication",
                    "Communication in the past",
                    "Communication in the present"
                ]
            },
            {
                name: "Community Institutions",
                topics: [
                    "Schools",
                    "Hospitals",
                    "Banks",
                    "Markets",
                    "Post offices"
                ]
            },
            {
                name: "Maps",
                topics: [
                    "Simple maps",
                    "Drawing maps",
                    "Reading maps",
                    "Locating places"
                ]
            },
            {
                name: "Landmarks and Directions",
                topics: [
                    "Identifying landmarks",
                    "Finding places",
                    "Using directions",
                    "Navigating surroundings"
                ]
            }
        ]
    })

];


/* =========================================================
   CBSE → NCERT → GRADE 3
   MATHEMATICS — MATHS MELA
========================================================= */

const CBSE_GRADE_3_MATHS_MELA = [

    /* -----------------------------------------------------
       CHAPTER 1
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 1,
        chapterName: "What's in a Name?",

        concepts: [
            {
                name: "Numbers and Number Names",
                topics: [
                    "Reading numbers",
                    "Writing numbers",
                    "Number names",
                    "Connecting numbers with names"
                ]
            },
            {
                name: "Place Value",
                topics: [
                    "Ones",
                    "Tens",
                    "Hundreds",
                    "Understanding the value of digits"
                ]
            },
            {
                name: "Comparing Numbers",
                topics: [
                    "Greater than",
                    "Less than",
                    "Equal to",
                    "Ordering numbers"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 2
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 2,
        chapterName: "Toy Joy",

        concepts: [
            {
                name: "Counting and Numbers",
                topics: [
                    "Counting objects",
                    "Number patterns",
                    "Grouping objects"
                ]
            },
            {
                name: "Addition",
                topics: [
                    "Adding quantities",
                    "Combining groups",
                    "Addition in everyday situations"
                ]
            },
            {
                name: "Subtraction",
                topics: [
                    "Taking away",
                    "Finding differences",
                    "Subtraction in everyday situations"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 3
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 3,
        chapterName: "Double Century",

        concepts: [
            {
                name: "Numbers up to 200",
                topics: [
                    "Reading numbers",
                    "Writing numbers",
                    "Counting up to 200"
                ]
            },
            {
                name: "Place Value",
                topics: [
                    "Hundreds",
                    "Tens",
                    "Ones",
                    "Expanded understanding of numbers"
                ]
            },
            {
                name: "Number Comparison",
                topics: [
                    "Comparing numbers",
                    "Ordering numbers",
                    "Number relationships"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 4
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 4,
        chapterName: "Vacation with My Nani Maa",

        concepts: [
            {
                name: "Numbers in Everyday Life",
                topics: [
                    "Using numbers in daily situations",
                    "Reading quantities",
                    "Comparing quantities"
                ]
            },
            {
                name: "Addition and Subtraction",
                topics: [
                    "Mental strategies",
                    "Adding quantities",
                    "Subtracting quantities",
                    "Word problems"
                ]
            },
            {
                name: "Problem Solving",
                topics: [
                    "Understanding a situation",
                    "Choosing an operation",
                    "Finding an answer",
                    "Checking reasonableness"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 5
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 5,
        chapterName: "Fun with Shapes",

        concepts: [
            {
                name: "2D Shapes",
                topics: [
                    "Recognising shapes",
                    "Comparing shapes",
                    "Properties of familiar shapes"
                ]
            },
            {
                name: "3D Shapes",
                topics: [
                    "Recognising solid shapes",
                    "Faces",
                    "Edges",
                    "Corners"
                ]
            },
            {
                name: "Shapes in Everyday Objects",
                topics: [
                    "Identifying shapes around us",
                    "Describing objects using shapes"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 6
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 6,
        chapterName: "House of Hundreds - I",

        concepts: [
            {
                name: "Numbers up to Hundreds",
                topics: [
                    "Reading numbers",
                    "Writing numbers",
                    "Counting in hundreds"
                ]
            },
            {
                name: "Place Value",
                topics: [
                    "Hundreds",
                    "Tens",
                    "Ones",
                    "Value of digits"
                ]
            },
            {
                name: "Number Representation",
                topics: [
                    "Expanded form",
                    "Grouping",
                    "Representing numbers"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 7
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 7,
        chapterName: "Raksha Bandhan",

        concepts: [
            {
                name: "Equal Groups",
                topics: [
                    "Making equal groups",
                    "Counting equal groups",
                    "Repeated addition"
                ]
            },
            {
                name: "Multiplication Ideas",
                topics: [
                    "Groups of equal size",
                    "Repeated addition",
                    "Multiplication situations"
                ]
            },
            {
                name: "Patterns",
                topics: [
                    "Number patterns",
                    "Repeated groups",
                    "Observing patterns"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 8
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 8,
        chapterName: "Fair Share",

        concepts: [
            {
                name: "Sharing Equally",
                topics: [
                    "Equal sharing",
                    "Distributing objects",
                    "Fair shares"
                ]
            },
            {
                name: "Division Ideas",
                topics: [
                    "Making equal groups",
                    "Sharing equally",
                    "Division situations"
                ]
            },
            {
                name: "Relationship between Multiplication and Division",
                topics: [
                    "Equal groups",
                    "Repeated addition",
                    "Sharing and grouping"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 9
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 9,
        chapterName: "House of Hundreds - II",

        concepts: [
            {
                name: "Three-Digit Numbers",
                topics: [
                    "Reading three-digit numbers",
                    "Writing three-digit numbers",
                    "Number representation"
                ]
            },
            {
                name: "Place Value",
                topics: [
                    "Hundreds",
                    "Tens",
                    "Ones",
                    "Expanded form"
                ]
            },
            {
                name: "Comparing and Ordering",
                topics: [
                    "Comparing three-digit numbers",
                    "Ascending order",
                    "Descending order"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 10
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 10,
        chapterName: "Fun at Class Party!",

        concepts: [
            {
                name: "Measurement of Length",
                topics: [
                    "Comparing lengths",
                    "Measuring length",
                    "Hand span",
                    "Footstep",
                    "Informal units",
                    "Standard units"
                ]
            },
            {
                name: "Using Measurement Tools",
                topics: [
                    "Choosing an appropriate tool",
                    "Measuring objects",
                    "Comparing measurements"
                ]
            },
            {
                name: "Standard and Non-standard Units",
                topics: [
                    "Informal measurement",
                    "Standard measurement",
                    "Need for standard units"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 11
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 11,
        chapterName: "Filling and Lifting",

        concepts: [
            {
                name: "Capacity",
                topics: [
                    "Comparing capacities",
                    "More and less capacity",
                    "Estimating capacity"
                ]
            },
            {
                name: "Volume",
                topics: [
                    "Filling containers",
                    "Comparing volumes",
                    "Measuring using containers"
                ]
            },
            {
                name: "Weight and Mass",
                topics: [
                    "Comparing weights",
                    "Heavier and lighter",
                    "Measuring mass"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 12
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 12,
        chapterName: "Give and Take",

        concepts: [
            {
                name: "Addition",
                topics: [
                    "Adding two numbers",
                    "Addition strategies",
                    "Addition in daily situations"
                ]
            },
            {
                name: "Subtraction",
                topics: [
                    "Subtracting numbers",
                    "Finding differences",
                    "Subtraction strategies"
                ]
            },
            {
                name: "Word Problems",
                topics: [
                    "Understanding situations",
                    "Selecting an operation",
                    "Solving problems",
                    "Checking answers"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 13
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 13,
        chapterName: "Time Goes On",

        concepts: [
            {
                name: "Time",
                topics: [
                    "Reading time",
                    "Clock",
                    "Hours",
                    "Minutes"
                ]
            },
            {
                name: "Duration",
                topics: [
                    "How long an activity takes",
                    "Comparing durations",
                    "Sequencing events"
                ]
            },
            {
                name: "Calendar",
                topics: [
                    "Days",
                    "Weeks",
                    "Months",
                    "Dates",
                    "Reading a calendar"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       CHAPTER 14
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Mathematics — Maths Mela",
        chapterNumber: 14,
        chapterName: "The Surajkund Fair",

        concepts: [
            {
                name: "Mathematics in Everyday Situations",
                topics: [
                    "Using numbers",
                    "Using addition",
                    "Using subtraction",
                    "Using multiplication",
                    "Using measurement"
                ]
            },
            {
                name: "Money",
                topics: [
                    "Recognising money",
                    "Comparing amounts",
                    "Buying and selling",
                    "Calculating amounts"
                ]
            },
            {
                name: "Problem Solving",
                topics: [
                    "Understanding a situation",
                    "Selecting mathematical operations",
                    "Multi-step problems",
                    "Checking solutions"
                ]
            }
        ]
    })

];


/* =========================================================
   CBSE → NCERT → GRADE 3
   ENGLISH — SANTOOR
========================================================= */

const CBSE_GRADE_3_SANTOOR = [

    /* -----------------------------------------------------
       UNIT 1 — FUN WITH FRIENDS
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 1 — Fun with Friends",
        chapterNumber: 1,
        chapterName: "Colours",

        concepts: [
            {
                name: "Colours",
                topics: [
                    "Names of colours",
                    "Identifying colours",
                    "Describing colours",
                    "Colours in everyday life"
                ]
            },
            {
                name: "Sharing and Friendship",
                topics: [
                    "Sharing",
                    "Friendship",
                    "Working together",
                    "Being helpful"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Colour words",
                    "Everyday words",
                    "Action words",
                    "Word recognition"
                ]
            },
            {
                name: "Consonant Blends",
                topics: [
                    "gr blend",
                    "cr blend",
                    "dr blend",
                    "pr blend"
                ]
            },
            {
                name: "Grammar in Context",
                topics: [
                    "Action words",
                    "Using words in sentences",
                    "Word identification"
                ]
            }
        ]
    }),


    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 1 — Fun with Friends",
        chapterNumber: 2,
        chapterName: "Badal and Moti",

        concepts: [
            {
                name: "Story Comprehension",
                topics: [
                    "Characters",
                    "Sequence of events",
                    "Setting",
                    "Cause and effect",
                    "Understanding the main idea"
                ]
            },
            {
                name: "Friendship and Care",
                topics: [
                    "Caring for animals",
                    "Helping others",
                    "Loyalty",
                    "Friendship"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Words related to animals",
                    "Words related to weather",
                    "Action words",
                    "Descriptive words"
                ]
            },
            {
                name: "Reading Skills",
                topics: [
                    "Reading for meaning",
                    "Finding details",
                    "Answering questions",
                    "Sequencing events"
                ]
            }
        ]
    }),


    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 1 — Fun with Friends",
        chapterNumber: 3,
        chapterName: "Best Friends",

        concepts: [
            {
                name: "Friendship",
                topics: [
                    "Qualities of a good friend",
                    "Helping friends",
                    "Sharing",
                    "Caring"
                ]
            },
            {
                name: "Story Comprehension",
                topics: [
                    "Characters",
                    "Events",
                    "Sequence",
                    "Main idea",
                    "Inference"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Describing people",
                    "Action words",
                    "Words related to friendship"
                ]
            },
            {
                name: "Language Expression",
                topics: [
                    "Speaking about friends",
                    "Expressing ideas",
                    "Answering in complete sentences"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       UNIT 2 — TOYS AND GAMES
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 2 — Toys and Games",
        chapterNumber: 4,
        chapterName: "Out in the Garden",

        concepts: [
            {
                name: "Garden and Nature",
                topics: [
                    "Plants",
                    "Flowers",
                    "Outdoor surroundings",
                    "Observing nature"
                ]
            },
            {
                name: "Picture Reading",
                topics: [
                    "Observing pictures",
                    "Identifying objects",
                    "Describing a scene",
                    "Using vocabulary from pictures"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Nature words",
                    "Garden words",
                    "Action words",
                    "Describing words"
                ]
            },
            {
                name: "Speaking Skills",
                topics: [
                    "Describing what is seen",
                    "Answering questions",
                    "Expressing observations"
                ]
            }
        ]
    }),


    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 2 — Toys and Games",
        chapterNumber: 5,
        chapterName: "Talking Toys",

        concepts: [
            {
                name: "Toys",
                topics: [
                    "Different kinds of toys",
                    "Describing toys",
                    "Using toys in imaginative situations"
                ]
            },
            {
                name: "Imagination",
                topics: [
                    "Imagining conversations",
                    "Creative thinking",
                    "Story situations"
                ]
            },
            {
                name: "Story Comprehension",
                topics: [
                    "Characters",
                    "Events",
                    "Sequence",
                    "Main idea"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Toy-related words",
                    "Action words",
                    "Describing words"
                ]
            }
        ]
    }),


    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 2 — Toys and Games",
        chapterNumber: 6,
        chapterName: "Paper Boats",

        concepts: [
            {
                name: "Paper Boats",
                topics: [
                    "Making paper boats",
                    "Playing with paper boats",
                    "Observing floating objects"
                ]
            },
            {
                name: "Nature and Water",
                topics: [
                    "Rain",
                    "Water",
                    "Floating objects",
                    "Outdoor play"
                ]
            },
            {
                name: "Sequence",
                topics: [
                    "Following steps",
                    "Ordering events",
                    "Understanding sequence"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Rain-related words",
                    "Water-related words",
                    "Action words",
                    "Descriptive words"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       UNIT 3 — GOOD FOOD
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 3 — Good Food",
        chapterNumber: 7,
        chapterName: "The Big Laddoo",

        concepts: [
            {
                name: "Food",
                topics: [
                    "Food items",
                    "Traditional food",
                    "Sharing food"
                ]
            },
            {
                name: "Story Comprehension",
                topics: [
                    "Characters",
                    "Events",
                    "Sequence",
                    "Problem and solution"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Food-related words",
                    "Describing words",
                    "Action words"
                ]
            },
            {
                name: "Comprehension and Inference",
                topics: [
                    "Finding information",
                    "Making simple inferences",
                    "Understanding character actions"
                ]
            }
        ]
    }),


    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 3 — Good Food",
        chapterNumber: 8,
        chapterName: "Thank God",

        concepts: [
            {
                name: "Food and Gratitude",
                topics: [
                    "Food",
                    "Being thankful",
                    "Appreciating what we have"
                ]
            },
            {
                name: "Comprehension",
                topics: [
                    "Understanding events",
                    "Identifying important details",
                    "Main idea",
                    "Inference"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Food-related words",
                    "Feelings",
                    "Action words",
                    "Describing words"
                ]
            },
            {
                name: "Language Expression",
                topics: [
                    "Expressing feelings",
                    "Speaking about experiences",
                    "Answering questions"
                ]
            }
        ]
    }),


    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 3 — Good Food",
        chapterNumber: 9,
        chapterName: "Madhu's Wish",

        concepts: [
            {
                name: "Wishes and Aspirations",
                topics: [
                    "Wishes",
                    "Dreams",
                    "Expressing desires",
                    "Making choices"
                ]
            },
            {
                name: "Story Comprehension",
                topics: [
                    "Character",
                    "Setting",
                    "Events",
                    "Problem and solution",
                    "Conclusion"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Words related to feelings",
                    "Action words",
                    "Describing words"
                ]
            },
            {
                name: "Creative Expression",
                topics: [
                    "Expressing wishes",
                    "Speaking about dreams",
                    "Writing simple sentences"
                ]
            }
        ]
    }),


    /* -----------------------------------------------------
       UNIT 4 — THE SKY
    ----------------------------------------------------- */

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 4 — The Sky",
        chapterNumber: 10,
        chapterName: "Night",

        concepts: [
            {
                name: "Night and the Sky",
                topics: [
                    "Night time",
                    "Sky",
                    "Darkness",
                    "Stars"
                ]
            },
            {
                name: "Poetry",
                topics: [
                    "Poem comprehension",
                    "Rhythm",
                    "Imagery",
                    "Meaning of lines"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Sky-related words",
                    "Describing words",
                    "Nature words"
                ]
            },
            {
                name: "Observation",
                topics: [
                    "Observing the night sky",
                    "Describing what is seen"
                ]
            }
        ]
    }),


    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 4 — The Sky",
        chapterNumber: 11,
        chapterName: "Chanda Mama Counts the Stars",

        concepts: [
            {
                name: "Stars and the Sky",
                topics: [
                    "Stars",
                    "Moon",
                    "Night sky",
                    "Counting stars"
                ]
            },
            {
                name: "Poetry and Rhythm",
                topics: [
                    "Poem comprehension",
                    "Rhythm",
                    "Repetition",
                    "Imagery"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Sky-related vocabulary",
                    "Number words",
                    "Describing words"
                ]
            },
            {
                name: "Creative Expression",
                topics: [
                    "Describing the night sky",
                    "Speaking about observations",
                    "Creative responses"
                ]
            }
        ]
    }),


    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "English",
        splitUp: "Unit 4 — The Sky",
        chapterNumber: 12,
        chapterName: "Chandrayaan",

        concepts: [
            {
                name: "Chandrayaan",
                topics: [
                    "India's Moon mission",
                    "Moon",
                    "Space exploration",
                    "Curiosity about space"
                ]
            },
            {
                name: "Scientific Curiosity",
                topics: [
                    "Asking questions",
                    "Finding information",
                    "Learning about space"
                ]
            },
            {
                name: "Reading Comprehension",
                topics: [
                    "Main idea",
                    "Important details",
                    "Sequence of events",
                    "Inference"
                ]
            },
            {
                name: "Vocabulary",
                topics: [
                    "Space-related words",
                    "Science-related words",
                    "Action words",
                    "Describing words"
                ]
            }
        ]
    })

];

/* =========================================================
   CBSE → NCERT → GRADE 3
   HINDI — वीणा
========================================================= */

const CBSE_GRADE_3_VEENA = [

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 1,
        chapterName: "सीखो",
        concepts: [
            {
                name: "सीखने की प्रवृत्ति",
                topics: [
                    "नई बातें सीखना",
                    "अनुभव से सीखना",
                    "प्रयास और अभ्यास"
                ]
            },
            {
                name: "पाठ-बोध",
                topics: [
                    "मुख्य भाव",
                    "पाठ से जानकारी प्राप्त करना",
                    "प्रश्नों के उत्तर देना"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 2,
        chapterName: "चींटी",
        concepts: [
            {
                name: "चींटी",
                topics: [
                    "चींटी का व्यवहार",
                    "मेहनत",
                    "अनुशासन",
                    "प्रकृति का अवलोकन"
                ]
            },
            {
                name: "कविता-बोध",
                topics: [
                    "कविता का भाव",
                    "कविता से जानकारी",
                    "प्रश्नों के उत्तर"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 3,
        chapterName: "कितने पैर?",
        concepts: [
            {
                name: "पशु-पक्षी",
                topics: [
                    "जानवरों की विशेषताएँ",
                    "पैरों की संख्या",
                    "अवलोकन"
                ]
            },
            {
                name: "भाषा-बोध",
                topics: [
                    "प्रश्न पूछना",
                    "उत्तर देना",
                    "शब्दों का अर्थ"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 4,
        chapterName: "बया हमारी चिड़िया रानी!",
        concepts: [
            {
                name: "बया पक्षी",
                topics: [
                    "बया का परिचय",
                    "घोंसला",
                    "पक्षी का व्यवहार",
                    "प्रकृति"
                ]
            },
            {
                name: "प्रकृति-बोध",
                topics: [
                    "पक्षियों का संसार",
                    "प्रकृति का अवलोकन",
                    "जीव-जंतुओं के प्रति संवेदनशीलता"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 5,
        chapterName: "आम का पेड़",
        concepts: [
            {
                name: "पेड़ और प्रकृति",
                topics: [
                    "आम का पेड़",
                    "पेड़ के उपयोग",
                    "प्रकृति से जुड़ाव"
                ]
            },
            {
                name: "प्रकृति-संरक्षण",
                topics: [
                    "पेड़ों का महत्व",
                    "पेड़ों की देखभाल",
                    "प्राकृतिक संसाधनों के प्रति संवेदनशीलता"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 6,
        chapterName: "बीरबल की खिचड़ी",
        concepts: [
            {
                name: "कहानी-बोध",
                topics: [
                    "पात्र",
                    "घटनाक्रम",
                    "समस्या",
                    "समाधान"
                ]
            },
            {
                name: "बुद्धिमत्ता",
                topics: [
                    "तर्क",
                    "चतुराई",
                    "समस्या का समाधान"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 7,
        chapterName: "मित्र को पत्र",
        concepts: [
            {
                name: "पत्र-लेखन",
                topics: [
                    "मित्र को पत्र",
                    "पत्र का उद्देश्य",
                    "विचार व्यक्त करना"
                ]
            },
            {
                name: "लेखन-अभिव्यक्ति",
                topics: [
                    "व्यक्तिगत अनुभव",
                    "भावनाओं की अभिव्यक्ति",
                    "वाक्य निर्माण"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 8,
        chapterName: "चतुर गीदड़",
        concepts: [
            {
                name: "कहानी-बोध",
                topics: [
                    "पात्र",
                    "घटनाक्रम",
                    "समस्या",
                    "समाधान"
                ]
            },
            {
                name: "चतुराई",
                topics: [
                    "सोच-विचार",
                    "युक्ति",
                    "परिस्थिति के अनुसार निर्णय"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 9,
        chapterName: "प्रकृति पर्व – फूलदेई",
        concepts: [
            {
                name: "फूलदेई",
                topics: [
                    "प्रकृति पर्व",
                    "फूल",
                    "स्थानीय परंपरा",
                    "सामुदायिक सहभागिता"
                ]
            },
            {
                name: "प्रकृति और संस्कृति",
                topics: [
                    "प्रकृति से संबंध",
                    "त्योहार",
                    "परंपराएँ"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 10,
        chapterName: "रस्साकशी",
        concepts: [
            {
                name: "खेल",
                topics: [
                    "रस्साकशी",
                    "खेल में सहभागिता",
                    "नियम"
                ]
            },
            {
                name: "सहयोग",
                topics: [
                    "मिलकर काम करना",
                    "टीम भावना",
                    "सहयोग"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 11,
        chapterName: "एक जादुई पिटारा",
        concepts: [
            {
                name: "कल्पना",
                topics: [
                    "कल्पनात्मक परिस्थितियाँ",
                    "रचनात्मक सोच",
                    "कहानी की घटनाएँ"
                ]
            },
            {
                name: "कहानी-बोध",
                topics: [
                    "पात्र",
                    "घटनाक्रम",
                    "मुख्य भाव"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 12,
        chapterName: "अपना-अपना काम",
        concepts: [
            {
                name: "काम और जिम्मेदारी",
                topics: [
                    "अलग-अलग काम",
                    "जिम्मेदारी",
                    "काम का महत्व"
                ]
            },
            {
                name: "सहयोग",
                topics: [
                    "मिलकर काम करना",
                    "दूसरों के काम का सम्मान",
                    "साझी जिम्मेदारी"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 13,
        chapterName: "पेड़ों की अम्मा ‘तिमक्का’",
        concepts: [
            {
                name: "तिमक्का",
                topics: [
                    "तिमक्का का कार्य",
                    "पेड़ों के प्रति लगाव",
                    "पर्यावरण संरक्षण"
                ]
            },
            {
                name: "पर्यावरण",
                topics: [
                    "पेड़ों का महत्व",
                    "वृक्षारोपण",
                    "प्रकृति की देखभाल"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 14,
        chapterName: "किसान की होशियारी",
        concepts: [
            {
                name: "किसान",
                topics: [
                    "किसान का जीवन",
                    "कृषि",
                    "मेहनत"
                ]
            },
            {
                name: "होशियारी और समस्या-समाधान",
                topics: [
                    "बुद्धिमानी",
                    "परिस्थिति को समझना",
                    "समस्या का समाधान"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 15,
        chapterName: "भारत",
        concepts: [
            {
                name: "भारत",
                topics: [
                    "भारत का परिचय",
                    "देश के प्रति लगाव",
                    "भारत की विविधता"
                ]
            },
            {
                name: "देश और संस्कृति",
                topics: [
                    "विविधता",
                    "एकता",
                    "भारतीय संस्कृति"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 16,
        chapterName: "चंद्रयान",
        concepts: [
            {
                name: "चंद्रयान",
                topics: [
                    "चंद्रमा",
                    "अंतरिक्ष",
                    "भारत का अंतरिक्ष अभियान",
                    "वैज्ञानिक जिज्ञासा"
                ]
            },
            {
                name: "संवाद",
                topics: [
                    "संवाद समझना",
                    "प्रश्न और उत्तर",
                    "जानकारी प्राप्त करना"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 17,
        chapterName: "बोलने वाली माँद",
        concepts: [
            {
                name: "कहानी-बोध",
                topics: [
                    "पात्र",
                    "घटनाक्रम",
                    "समस्या",
                    "समाधान"
                ]
            },
            {
                name: "बुद्धिमत्ता",
                topics: [
                    "सोच-विचार",
                    "स्थिति को समझना",
                    "युक्ति"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grade: 3,
        subject: "Hindi",
        splitUp: "वीणा",
        chapterNumber: 18,
        chapterName: "हम अनेक किंतु एक",
        concepts: [
            {
                name: "विविधता",
                topics: [
                    "अनेकता",
                    "भिन्नताएँ",
                    "विविध संस्कृतियाँ"
                ]
            },
            {
                name: "एकता",
                topics: [
                    "एकता",
                    "सह-अस्तित्व",
                    "साथ मिलकर रहना"
                ]
            }
        ]
    })

];

/* =========================================================
   TAMIL NADU STATE BOARD → SAMACHEER KALVI
   GRADE 3 — TAMIL
   SOURCE: TAMIL NADU GOVERNMENT CLASS 3 TAMIL TEXTBOOK
========================================================= */

const SAMACHEER_GRADE_3_TAMIL = [

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 1,
        chapterName: "வா வா முயலே!",
        concepts: [
            {
                name: "முயல்",
                topics: [
                    "முயலின் தோற்றம்",
                    "முயலின் செயல்கள்",
                    "இயற்கையுடன் தொடர்பு"
                ]
            },
            {
                name: "மொழித்திறன்",
                topics: [
                    "சொற்களைப் படித்தல்",
                    "சொல் பொருள்",
                    "பேசுதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 2,
        chapterName: "செய்து மகிழலாம்",
        concepts: [
            {
                name: "செயல்பாடுகள்",
                topics: [
                    "செய்து கற்றல்",
                    "படைப்பாற்றல் செயல்பாடுகள்",
                    "குழுச் செயல்பாடு"
                ]
            },
            {
                name: "மொழித்திறன்",
                topics: [
                    "சொல் உருவாக்கம்",
                    "படத்தைப் பார்த்துப் பேசுதல்",
                    "சொற்களைப் பயன்படுத்துதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 3,
        chapterName: "கண்ணன் செய்த உதவி",
        concepts: [
            {
                name: "உதவி",
                topics: [
                    "பிறருக்கு உதவுதல்",
                    "சூழ்நிலையைப் புரிந்துகொள்ளுதல்",
                    "மனிதநேயம்"
                ]
            },
            {
                name: "கதைப்பொருள்",
                topics: [
                    "கதை நிகழ்வுகள்",
                    "கதாபாத்திரங்கள்",
                    "கதைப் புரிதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 4,
        chapterName: "நமது நண்பர்",
        concepts: [
            {
                name: "நட்பு",
                topics: [
                    "நண்பரின் சிறப்பு",
                    "நட்பின் முக்கியத்துவம்",
                    "நல்ல உறவு"
                ]
            },
            {
                name: "மொழிப்பயிற்சி",
                topics: [
                    "சொல் பொருள்",
                    "வாக்கியம் அமைத்தல்",
                    "கருத்தைப் பேசுதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 5,
        chapterName: "மாட்டு வண்டியிலே...",
        concepts: [
            {
                name: "மாட்டு வண்டி",
                topics: [
                    "மாட்டு வண்டியின் பயன்பாடு",
                    "பயணம்",
                    "கிராமிய வாழ்க்கை"
                ]
            },
            {
                name: "சுற்றுப்புறம்",
                topics: [
                    "கிராமச் சூழல்",
                    "பயண அனுபவம்",
                    "சுற்றுப்புறக் காட்சிகள்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 6,
        chapterName: "டும்... டும்... சின்னு",
        concepts: [
            {
                name: "சின்னு",
                topics: [
                    "கதை நிகழ்வுகள்",
                    "கதாபாத்திரம்",
                    "செயல்கள்"
                ]
            },
            {
                name: "ஒலி மற்றும் மொழி",
                topics: [
                    "ஒலிக்குறிப்பு",
                    "சொற்களின் ஒலி",
                    "பேச்சுத்திறன்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 7,
        chapterName: "தனித்திறமை",
        concepts: [
            {
                name: "தனித்திறமை",
                topics: [
                    "திறமைகளை அறிதல்",
                    "தனித்திறன்",
                    "திறமையை வெளிப்படுத்துதல்"
                ]
            },
            {
                name: "தன்னம்பிக்கை",
                topics: [
                    "முயற்சி",
                    "தன்னம்பிக்கை",
                    "செயலில் ஈடுபாடு"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 8,
        chapterName: "இறகு யாருடையது?",
        concepts: [
            {
                name: "இறகு",
                topics: [
                    "இறகு",
                    "பறவைகள்",
                    "கவனித்தல்"
                ]
            },
            {
                name: "ஆராய்தல்",
                topics: [
                    "கேள்வி எழுப்புதல்",
                    "ஆதாரத்தைப் பார்த்தல்",
                    "முடிவுக்கு வருதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 9,
        chapterName: "ஒன்றுபட்டால் உண்டு வாழ்வு",
        concepts: [
            {
                name: "ஒற்றுமை",
                topics: [
                    "ஒன்றுபட்டு செயல்படுதல்",
                    "ஒற்றுமையின் வலிமை",
                    "கூட்டுச் செயல்பாடு"
                ]
            },
            {
                name: "வாழ்வியல்",
                topics: [
                    "ஒத்துழைப்பு",
                    "பிறருடன் இணைந்து செயல்படுதல்",
                    "நல்லுறவு"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 10,
        chapterName: "சான்றோர் மொழி",
        concepts: [
            {
                name: "சான்றோர் மொழி",
                topics: [
                    "நல்ல கருத்துகள்",
                    "அறிவுரை",
                    "வாழ்வியல் கருத்துகள்"
                ]
            },
            {
                name: "மொழிப்புரிதல்",
                topics: [
                    "கருத்தைப் புரிந்துகொள்ளுதல்",
                    "சொல் பொருள்",
                    "கருத்தை வெளிப்படுத்துதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 11,
        chapterName: "காட்டில் திருவிழா?",
        concepts: [
            {
                name: "காடு",
                topics: [
                    "காட்டுச் சூழல்",
                    "விலங்குகள்",
                    "இயற்கை"
                ]
            },
            {
                name: "திருவிழா",
                topics: [
                    "விழா",
                    "கூட்டுச் செயல்பாடு",
                    "கதை நிகழ்வுகள்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 12,
        chapterName: "கொழுக்கட்டை ஏன் வேகல?",
        concepts: [
            {
                name: "கொழுக்கட்டை",
                topics: [
                    "உணவு",
                    "செய்முறை",
                    "சமையல் அனுபவம்"
                ]
            },
            {
                name: "கதைப்புரிதல்",
                topics: [
                    "நிகழ்வுகளின் வரிசை",
                    "காரணம்",
                    "விளைவு"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 13,
        chapterName: "எழில் கொஞ்சும் அருவி",
        concepts: [
            {
                name: "அருவி",
                topics: [
                    "அருவியின் இயற்கைக் காட்சி",
                    "நீர்",
                    "இயற்கை அழகு"
                ]
            },
            {
                name: "சுற்றுச்சூழல்",
                topics: [
                    "இயற்கையை ரசித்தல்",
                    "இயற்கையைப் பாதுகாத்தல்",
                    "நீரின் முக்கியத்துவம்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 14,
        chapterName: "கல்வி கண் போன்றது",
        concepts: [
            {
                name: "கல்வி",
                topics: [
                    "கல்வியின் முக்கியத்துவம்",
                    "கற்றல்",
                    "அறிவு"
                ]
            },
            {
                name: "வாழ்வியல்",
                topics: [
                    "கல்வி தரும் பயன்",
                    "முயற்சி",
                    "நல்ல பழக்கங்கள்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 15,
        chapterName: "வீம்பால் வந்த விளைவு",
        concepts: [
            {
                name: "வீம்பு",
                topics: [
                    "பிடிவாதம்",
                    "தவறான முடிவு",
                    "செயலின் விளைவு"
                ]
            },
            {
                name: "வாழ்வியல் கருத்து",
                topics: [
                    "சிந்தித்து செயல்படுதல்",
                    "தவறுகளில் இருந்து கற்றல்",
                    "நல்ல முடிவெடுத்தல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 16,
        chapterName: "நூலகம்",
        concepts: [
            {
                name: "நூலகம்",
                topics: [
                    "நூலகத்தின் பயன்பாடு",
                    "நூல்கள்",
                    "வாசிப்பு"
                ]
            },
            {
                name: "தகவல் பெறுதல்",
                topics: [
                    "நூலைத் தேர்ந்தெடுத்தல்",
                    "வாசித்தல்",
                    "அறிவைப் பெறுதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 17,
        chapterName: "நாயும் ஓநாயும்",
        concepts: [
            {
                name: "நாய் மற்றும் ஓநாய்",
                topics: [
                    "விலங்குகளின் இயல்பு",
                    "வாழ்க்கை முறை",
                    "தேர்வு"
                ]
            },
            {
                name: "கதைப்பொருள்",
                topics: [
                    "பாத்திரங்கள்",
                    "நிகழ்வுகள்",
                    "கருத்தைப் புரிந்துகொள்ளுதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 18,
        chapterName: "திருக்குறள் கதைகள்",
        concepts: [
            {
                name: "திருக்குறள்",
                topics: [
                    "திருக்குறள் கருத்துகள்",
                    "அறம்",
                    "வாழ்வியல் அறிவுரை"
                ]
            },
            {
                name: "கதை வழிக் கற்றல்",
                topics: [
                    "கதையின் மூலம் கருத்தைப் புரிதல்",
                    "நிகழ்வு மற்றும் கருத்து",
                    "வாழ்வில் பயன்படுத்துதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 19,
        chapterName: "முடிவெடுப்போமா?",
        concepts: [
            {
                name: "முடிவெடுத்தல்",
                topics: [
                    "சூழ்நிலையைப் புரிந்துகொள்ளுதல்",
                    "தேர்வுகளைப் பரிசீலித்தல்",
                    "சரியான முடிவு"
                ]
            },
            {
                name: "சிந்தனைத்திறன்",
                topics: [
                    "காரணம் கூறுதல்",
                    "விளைவுகளை எண்ணுதல்",
                    "பிரச்சினைக்குத் தீர்வு காணுதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 20,
        chapterName: "தூக்கணாங்குருவியும் ஒட்டகச்சிவிங்கியும்",
        concepts: [
            {
                name: "தூக்கணாங்குருவி மற்றும் ஒட்டகச்சிவிங்கி",
                topics: [
                    "விலங்குகள் மற்றும் பறவைகள்",
                    "தனித்தன்மைகள்",
                    "இயற்கை"
                ]
            },
            {
                name: "கதைப்புரிதல்",
                topics: [
                    "கதாபாத்திரங்கள்",
                    "நிகழ்வுகள்",
                    "கருத்து"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 21,
        chapterName: "உள்ளங்கையில் ஓர் உலகம்",
        concepts: [
            {
                name: "உலகம் மற்றும் தகவல்",
                topics: [
                    "தகவல் அறிதல்",
                    "தொழில்நுட்பம்",
                    "உலகத்தை அறிதல்"
                ]
            },
            {
                name: "தகவல் தொடர்பு",
                topics: [
                    "தகவல் பரிமாற்றம்",
                    "கருத்துப் பகிர்வு",
                    "தொடர்பு கொள்ளுதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 22,
        chapterName: "நட்பே உயர்வு",
        concepts: [
            {
                name: "நட்பு",
                topics: [
                    "நட்பின் சிறப்பு",
                    "நண்பர்களிடம் நல்லுறவு",
                    "ஒற்றுமை"
                ]
            },
            {
                name: "நல்ல பண்புகள்",
                topics: [
                    "அன்பு",
                    "நம்பிக்கை",
                    "ஒத்துழைப்பு"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 23,
        chapterName: "துணிந்தவர் வெற்றி கொள்வர்",
        concepts: [
            {
                name: "துணிவு",
                topics: [
                    "துணிந்து செயல்படுதல்",
                    "சவாலை எதிர்கொள்ளுதல்",
                    "முயற்சி"
                ]
            },
            {
                name: "வெற்றி",
                topics: [
                    "விடாமுயற்சி",
                    "தன்னம்பிக்கை",
                    "செயலின் விளைவு"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 24,
        chapterName: "மழைநீர்",
        concepts: [
            {
                name: "மழைநீர்",
                topics: [
                    "மழையின் முக்கியத்துவம்",
                    "நீரின் பயன்பாடு",
                    "மழைநீர் சேமிப்பு"
                ]
            },
            {
                name: "நீர் பாதுகாப்பு",
                topics: [
                    "நீரைச் சேமித்தல்",
                    "நீரை வீணாக்காமல் பயன்படுத்துதல்",
                    "சுற்றுச்சூழல் பாதுகாப்பு"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 25,
        chapterName: "தமிழ்மொழியின் பெருமை",
        concepts: [
            {
                name: "தமிழ்மொழி",
                topics: [
                    "தமிழ்மொழியின் சிறப்பு",
                    "தமிழின் பெருமை",
                    "மொழிப் பற்றுணர்வு"
                ]
            },
            {
                name: "மொழி மற்றும் பண்பாடு",
                topics: [
                    "தமிழ் இலக்கிய மரபு",
                    "மொழியின் பயன்பாடு",
                    "தமிழ் பண்பாடு"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 26,
        chapterName: "அறிவூட்டும் தொலைக்காட்சி செய்திகள்",
        concepts: [
            {
                name: "செய்திகள்",
                topics: [
                    "செய்தி அறிதல்",
                    "தகவல் புரிதல்",
                    "செய்தியின் முக்கியத்துவம்"
                ]
            },
            {
                name: "தகவல் தொடர்பு",
                topics: [
                    "தொலைக்காட்சி",
                    "தகவல் பரிமாற்றம்",
                    "செய்திகளைப் புரிந்துகொள்ளுதல்"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Tamil",
        splitUp: "பாடநூல்",
        chapterNumber: 27,
        chapterName: "நல்வழி",
        concepts: [
            {
                name: "நல்வழி",
                topics: [
                    "நல்லொழுக்கம்",
                    "நல்ல வாழ்க்கை",
                    "அறிவுரை"
                ]
            },
            {
                name: "வாழ்வியல் நெறிகள்",
                topics: [
                    "நல்ல பண்புகள்",
                    "பிறருக்கு உதவுதல்",
                    "நல்ல செயல்கள்"
                ]
            }
        ]
    })

];

/* =========================================================
   TAMIL NADU STATE BOARD → SAMACHEER KALVI
   GRADE 3 — MATHEMATICS
   ACADEMIC YEAR: 2026-27
========================================================= */

const SAMACHEER_GRADE_3_MATHEMATICS = [

    /* ===================== TERM I ===================== */

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term I",
        chapterNumber: 1,
        chapterName: "Geometry",
        concepts: [
            {
                name: "Shapes",
                topics: [
                    "Basic geometric shapes",
                    "Identifying shapes",
                    "Comparing shapes",
                    "Properties of shapes"
                ]
            },
            {
                name: "Spatial understanding",
                topics: [
                    "Position",
                    "Direction",
                    "Shape identification",
                    "Visual reasoning"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term I",
        chapterNumber: 2,
        chapterName: "Numbers",
        concepts: [
            {
                name: "Numbers",
                topics: [
                    "Reading numbers",
                    "Writing numbers",
                    "Comparing numbers",
                    "Ordering numbers"
                ]
            },
            {
                name: "Place value",
                topics: [
                    "Place value",
                    "Expanded form",
                    "Number formation",
                    "Number comparison"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term I",
        chapterNumber: 3,
        chapterName: "Patterns",
        concepts: [
            {
                name: "Patterns",
                topics: [
                    "Number patterns",
                    "Shape patterns",
                    "Repeating patterns",
                    "Growing patterns"
                ]
            },
            {
                name: "Pattern reasoning",
                topics: [
                    "Finding the next element",
                    "Identifying rules",
                    "Completing patterns",
                    "Creating patterns"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term I",
        chapterNumber: 4,
        chapterName: "Measurements",
        concepts: [
            {
                name: "Measurement",
                topics: [
                    "Length",
                    "Weight",
                    "Capacity",
                    "Comparing quantities"
                ]
            },
            {
                name: "Measurement reasoning",
                topics: [
                    "Choosing suitable units",
                    "Estimating quantities",
                    "Comparing measurements",
                    "Solving measurement problems"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term I",
        chapterNumber: 5,
        chapterName: "Time",
        concepts: [
            {
                name: "Time",
                topics: [
                    "Reading time",
                    "Clock",
                    "Hours and minutes",
                    "Time sequence"
                ]
            },
            {
                name: "Calendar",
                topics: [
                    "Days",
                    "Weeks",
                    "Months",
                    "Finding dates"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term I",
        chapterNumber: 6,
        chapterName: "Information Processing",
        concepts: [
            {
                name: "Information",
                topics: [
                    "Collecting information",
                    "Reading information",
                    "Organising information",
                    "Comparing information"
                ]
            },
            {
                name: "Data interpretation",
                topics: [
                    "Tables",
                    "Pictures",
                    "Simple representations",
                    "Answering questions from data"
                ]
            }
        ]
    }),

    /* ===================== TERM II ===================== */

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term II",
        chapterNumber: 1,
        chapterName: "Numbers",
        concepts: [
            {
                name: "Number operations",
                topics: [
                    "Addition",
                    "Subtraction",
                    "Number relationships",
                    "Mental calculation"
                ]
            },
            {
                name: "Problem solving",
                topics: [
                    "Word problems",
                    "Reasoning with numbers",
                    "Choosing operations",
                    "Checking answers"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term II",
        chapterNumber: 2,
        chapterName: "Patterns",
        concepts: [
            {
                name: "Number patterns",
                topics: [
                    "Number sequences",
                    "Repeating patterns",
                    "Increasing patterns",
                    "Decreasing patterns"
                ]
            },
            {
                name: "Logical reasoning",
                topics: [
                    "Finding missing elements",
                    "Identifying pattern rules",
                    "Predicting the next element"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term II",
        chapterNumber: 3,
        chapterName: "Measurements",
        concepts: [
            {
                name: "Measurement",
                topics: [
                    "Length",
                    "Weight",
                    "Capacity",
                    "Standard units"
                ]
            },
            {
                name: "Measurement problems",
                topics: [
                    "Comparing measurements",
                    "Estimating measurements",
                    "Solving practical problems"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term II",
        chapterNumber: 4,
        chapterName: "Time",
        concepts: [
            {
                name: "Time",
                topics: [
                    "Reading clocks",
                    "Hours",
                    "Minutes",
                    "Time intervals"
                ]
            },
            {
                name: "Calendar",
                topics: [
                    "Days",
                    "Weeks",
                    "Months",
                    "Dates"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term II",
        chapterNumber: 5,
        chapterName: "Information Processing",
        concepts: [
            {
                name: "Data",
                topics: [
                    "Collecting data",
                    "Organising data",
                    "Reading tables",
                    "Comparing information"
                ]
            },
            {
                name: "Data reasoning",
                topics: [
                    "Finding information",
                    "Answering questions",
                    "Drawing conclusions from simple data"
                ]
            }
        ]
    }),

    /* ===================== TERM III ===================== */

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term III",
        chapterNumber: 1,
        chapterName: "Geometry",
        concepts: [
            {
                name: "Geometry",
                topics: [
                    "Shapes",
                    "Shape properties",
                    "Identifying shapes",
                    "Comparing shapes"
                ]
            },
            {
                name: "Spatial reasoning",
                topics: [
                    "Position",
                    "Direction",
                    "Visualisation",
                    "Shape relationships"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term III",
        chapterNumber: 2,
        chapterName: "Numbers",
        concepts: [
            {
                name: "Numbers",
                topics: [
                    "Number operations",
                    "Addition",
                    "Subtraction",
                    "Number relationships"
                ]
            },
            {
                name: "Problem solving",
                topics: [
                    "Word problems",
                    "Logical reasoning",
                    "Choosing operations",
                    "Checking solutions"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term III",
        chapterNumber: 3,
        chapterName: "Patterns",
        concepts: [
            {
                name: "Patterns",
                topics: [
                    "Number patterns",
                    "Shape patterns",
                    "Repeating patterns",
                    "Growing patterns"
                ]
            },
            {
                name: "Pattern reasoning",
                topics: [
                    "Finding missing elements",
                    "Identifying rules",
                    "Predicting patterns",
                    "Creating patterns"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term III",
        chapterNumber: 4,
        chapterName: "Measurements",
        concepts: [
            {
                name: "Measurement",
                topics: [
                    "Length",
                    "Weight",
                    "Capacity",
                    "Comparing measurements"
                ]
            },
            {
                name: "Practical measurement",
                topics: [
                    "Estimating",
                    "Selecting units",
                    "Solving measurement problems"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term III",
        chapterNumber: 5,
        chapterName: "Money",
        concepts: [
            {
                name: "Money",
                topics: [
                    "Coins",
                    "Notes",
                    "Recognising money",
                    "Comparing amounts"
                ]
            },
            {
                name: "Money calculations",
                topics: [
                    "Adding amounts",
                    "Subtracting amounts",
                    "Buying and selling",
                    "Finding change"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term III",
        chapterNumber: 6,
        chapterName: "Time",
        concepts: [
            {
                name: "Time",
                topics: [
                    "Reading clocks",
                    "Hours and minutes",
                    "Time intervals",
                    "Comparing durations"
                ]
            },
            {
                name: "Calendar",
                topics: [
                    "Days",
                    "Weeks",
                    "Months",
                    "Dates"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: 3,
        subject: "Mathematics",
        splitUp: "Term III",
        chapterNumber: 7,
        chapterName: "Information Processing",
        concepts: [
            {
                name: "Information processing",
                topics: [
                    "Collecting information",
                    "Organising information",
                    "Reading data",
                    "Comparing data"
                ]
            },
            {
                name: "Data interpretation",
                topics: [
                    "Tables",
                    "Simple charts",
                    "Finding information",
                    "Drawing conclusions"
                ]
            }
        ]
    })

];

// ============================================================
// SAMACHEER KALVI – GRADE 3 – SCIENCE
// Academic Year: 2026-27
// ============================================================

const SAMACHEER_GRADE_3_SCIENCE = [

    // --------------------------------------------------------
    // TERM I
    // --------------------------------------------------------

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term I",
        chapterNumber: 1,
        chapterName: "My Body",
        concepts: [
            {
                name: "Human Body",
                topics: [
                    "Parts of the human body",
                    "Functions of body parts",
                    "Sense organs",
                    "Importance of each sense organ"
                ]
            },
            {
                name: "Body Care",
                topics: [
                    "Personal hygiene",
                    "Clean habits",
                    "Healthy body practices"
                ]
            },
            {
                name: "Health and Safety",
                topics: [
                    "Keeping the body clean",
                    "Healthy daily habits",
                    "Protecting the body"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term I",
        chapterNumber: 2,
        chapterName: "States of Matter",
        concepts: [
            {
                name: "Matter",
                topics: [
                    "Meaning of matter",
                    "Solids",
                    "Liquids",
                    "Gases"
                ]
            },
            {
                name: "Properties of Matter",
                topics: [
                    "Shape of solids",
                    "Flowing liquids",
                    "Space occupied by matter",
                    "Examples from daily life"
                ]
            },
            {
                name: "Changes in Matter",
                topics: [
                    "Melting",
                    "Freezing",
                    "Evaporation",
                    "Changes caused by heating and cooling"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term I",
        chapterNumber: 3,
        chapterName: "Force",
        concepts: [
            {
                name: "Force",
                topics: [
                    "Meaning of force",
                    "Push",
                    "Pull",
                    "Force in everyday activities"
                ]
            },
            {
                name: "Effects of Force",
                topics: [
                    "Moving an object",
                    "Stopping an object",
                    "Changing direction",
                    "Changing the shape of an object"
                ]
            },
            {
                name: "Force in Daily Life",
                topics: [
                    "Pushing and pulling objects",
                    "Opening and closing objects",
                    "Moving vehicles",
                    "Simple applications of force"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term I",
        chapterNumber: 4,
        chapterName: "Science in Everyday Life",
        concepts: [
            {
                name: "Science Around Us",
                topics: [
                    "Science in daily activities",
                    "Observation",
                    "Simple scientific thinking"
                ]
            },
            {
                name: "Kitchen Science",
                topics: [
                    "Boiling",
                    "Steaming",
                    "Cooking processes",
                    "Boiling point"
                ]
            },
            {
                name: "Home Appliances",
                topics: [
                    "Uses of common appliances",
                    "Refrigerator",
                    "Pressure cooker",
                    "Safe use of appliances"
                ]
            },
            {
                name: "Simple Investigations",
                topics: [
                    "Light and shadow",
                    "Observation-based activities",
                    "Simple experiments",
                    "Drawing conclusions"
                ]
            }
        ]
    }),

    // --------------------------------------------------------
    // TERM II
    // --------------------------------------------------------

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term II",
        chapterNumber: 1,
        chapterName: "Food",
        concepts: [
            {
                name: "Food We Eat",
                topics: [
                    "Different kinds of food",
                    "Food sources",
                    "Plant-based foods",
                    "Animal-based foods"
                ]
            },
            {
                name: "Nutrients and Health",
                topics: [
                    "Healthy food",
                    "Balanced food",
                    "Importance of different food groups"
                ]
            },
            {
                name: "Food Habits",
                topics: [
                    "Healthy eating habits",
                    "Food cleanliness",
                    "Safe food practices"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term II",
        chapterNumber: 2,
        chapterName: "Water",
        concepts: [
            {
                name: "Importance of Water",
                topics: [
                    "Uses of water",
                    "Water for humans",
                    "Water for plants",
                    "Water for animals"
                ]
            },
            {
                name: "Sources of Water",
                topics: [
                    "Rain",
                    "Rivers",
                    "Lakes",
                    "Groundwater"
                ]
            },
            {
                name: "Water Conservation",
                topics: [
                    "Saving water",
                    "Avoiding wastage",
                    "Clean water",
                    "Responsible use of water"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term II",
        chapterNumber: 3,
        chapterName: "Plants",
        concepts: [
            {
                name: "Parts of Plants",
                topics: [
                    "Root",
                    "Stem",
                    "Leaves",
                    "Flowers",
                    "Fruits",
                    "Seeds"
                ]
            },
            {
                name: "Functions of Plant Parts",
                topics: [
                    "Functions of roots",
                    "Functions of stems",
                    "Functions of leaves",
                    "Functions of flowers",
                    "Functions of fruits and seeds"
                ]
            },
            {
                name: "Plants Around Us",
                topics: [
                    "Different types of plants",
                    "Uses of plants",
                    "Plants as food",
                    "Plants in our surroundings"
                ]
            }
        ]
    }),

    // --------------------------------------------------------
    // TERM III
    // --------------------------------------------------------

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term III",
        chapterNumber: 1,
        chapterName: "Our Environment",
        concepts: [
            {
                name: "Living and Non-living Things",
                topics: [
                    "Living things",
                    "Non-living things",
                    "Differences between living and non-living things"
                ]
            },
            {
                name: "Environment",
                topics: [
                    "Living components",
                    "Non-living components",
                    "Interdependence",
                    "Environmental balance"
                ]
            },
            {
                name: "Care for Environment",
                topics: [
                    "Keeping surroundings clean",
                    "Protecting nature",
                    "Responsible environmental practices"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term III",
        chapterNumber: 2,
        chapterName: "Animal Life",
        concepts: [
            {
                name: "Animals",
                topics: [
                    "Different animals",
                    "Animal habitats",
                    "Animals around us"
                ]
            },
            {
                name: "Animal Needs",
                topics: [
                    "Food",
                    "Water",
                    "Shelter",
                    "Protection"
                ]
            },
            {
                name: "Animal Life",
                topics: [
                    "Movement",
                    "Growth",
                    "Reproduction",
                    "Animal adaptations"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Science",
        splitUp: "Term III",
        chapterNumber: 3,
        chapterName: "Air",
        concepts: [
            {
                name: "Air Around Us",
                topics: [
                    "Presence of air",
                    "Air around living things",
                    "Importance of air"
                ]
            },
            {
                name: "Uses of Air",
                topics: [
                    "Breathing",
                    "Burning",
                    "Movement",
                    "Inflating objects"
                ]
            },
            {
                name: "Moving Air",
                topics: [
                    "Wind",
                    "Breeze",
                    "Strong winds",
                    "Effects of moving air"
                ]
            }
        ]
    })
];

// ============================================================
// SAMACHEER KALVI – GRADE 3 – SOCIAL SCIENCE
// Academic Year: 2026-27
// ============================================================

const SAMACHEER_GRADE_3_SOCIAL_SCIENCE = [

    // --------------------------------------------------------
    // TERM I
    // --------------------------------------------------------

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term I",
        chapterNumber: 1,
        chapterName: "Let Us Travel",
        concepts: [
            {
                name: "Transport",
                topics: [
                    "Land transport",
                    "Water transport",
                    "Air transport",
                    "Different means of transport"
                ]
            },
            {
                name: "Modes of Travel",
                topics: [
                    "Roadways",
                    "Railways",
                    "Waterways",
                    "Airways"
                ]
            },
            {
                name: "Travel and Communication",
                topics: [
                    "Importance of transport",
                    "Travelling from one place to another",
                    "Transport in daily life"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term I",
        chapterNumber: 2,
        chapterName: "The Story of Food",
        concepts: [
            {
                name: "Food Habits",
                topics: [
                    "Different food habits",
                    "Food eaten in different places",
                    "Traditional food"
                ]
            },
            {
                name: "Sources of Food",
                topics: [
                    "Food from plants",
                    "Food from animals",
                    "Local food resources"
                ]
            },
            {
                name: "Food and Culture",
                topics: [
                    "Food traditions",
                    "Food festivals",
                    "Food in different communities"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term I",
        chapterNumber: 3,
        chapterName: "People Who Help Us",
        concepts: [
            {
                name: "Community Helpers",
                topics: [
                    "Doctors",
                    "Nurses",
                    "Teachers",
                    "Police officers",
                    "Firefighters"
                ]
            },
            {
                name: "Occupations",
                topics: [
                    "Different occupations",
                    "Services provided by people",
                    "Importance of different occupations"
                ]
            },
            {
                name: "Our Community",
                topics: [
                    "People working together",
                    "Helping one another",
                    "Community services"
                ]
            }
        ]
    }),

    // --------------------------------------------------------
    // TERM II
    // --------------------------------------------------------

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term II",
        chapterNumber: 4,
        chapterName: "Our District",
        concepts: [
            {
                name: "District",
                topics: [
                    "Meaning of district",
                    "District administration",
                    "Important places in a district"
                ]
            },
            {
                name: "Places in Our District",
                topics: [
                    "Towns",
                    "Villages",
                    "Important institutions",
                    "Tourist places"
                ]
            },
            {
                name: "District Administration",
                topics: [
                    "District collector",
                    "Government offices",
                    "Public services"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term II",
        chapterNumber: 5,
        chapterName: "The Five Physiographical Divisions of Ancient Tamil Nadu",
        concepts: [
            {
                name: "Five Physiographical Divisions",
                topics: [
                    "Kurinji",
                    "Mullai",
                    "Marutham",
                    "Neithal",
                    "Palai"
                ]
            },
            {
                name: "Landforms and Life",
                topics: [
                    "Mountains",
                    "Forests",
                    "Agricultural lands",
                    "Coastal regions",
                    "Dry regions"
                ]
            },
            {
                name: "People and Occupations",
                topics: [
                    "Occupations in different regions",
                    "Food habits",
                    "Way of life"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term II",
        chapterNumber: 6,
        chapterName: "Our Feathered Friends",
        concepts: [
            {
                name: "Birds",
                topics: [
                    "Common birds",
                    "Features of birds",
                    "Bird habitats"
                ]
            },
            {
                name: "Bird Adaptations",
                topics: [
                    "Beaks",
                    "Feet",
                    "Wings",
                    "Feathers"
                ]
            },
            {
                name: "Birds and Environment",
                topics: [
                    "Birds in our surroundings",
                    "Importance of birds",
                    "Protecting birds"
                ]
            }
        ]
    }),

    // --------------------------------------------------------
    // TERM III
    // --------------------------------------------------------

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term III",
        chapterNumber: 7,
        chapterName: "The World I Like",
        concepts: [
            {
                name: "Our World",
                topics: [
                    "People around us",
                    "Different places",
                    "Different ways of life"
                ]
            },
            {
                name: "Living Together",
                topics: [
                    "Cooperation",
                    "Respecting others",
                    "Living peacefully"
                ]
            },
            {
                name: "Responsible Citizenship",
                topics: [
                    "Good habits",
                    "Helping others",
                    "Caring for surroundings"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term III",
        chapterNumber: 8,
        chapterName: "My Neighbourhood",
        concepts: [
            {
                name: "Neighbourhood",
                topics: [
                    "Meaning of neighbourhood",
                    "People in our neighbourhood",
                    "Places in our neighbourhood"
                ]
            },
            {
                name: "Public Places",
                topics: [
                    "Schools",
                    "Hospitals",
                    "Post offices",
                    "Police stations",
                    "Markets"
                ]
            },
            {
                name: "Community Life",
                topics: [
                    "Helping neighbours",
                    "Community relationships",
                    "Keeping neighbourhood clean"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term III",
        chapterNumber: 9,
        chapterName: "On My Way to School",
        concepts: [
            {
                name: "Our Route",
                topics: [
                    "Route from home to school",
                    "Roads",
                    "Landmarks",
                    "Important places on the way"
                ]
            },
            {
                name: "Road Safety",
                topics: [
                    "Traffic rules",
                    "Traffic signals",
                    "Pedestrian safety",
                    "Safe crossing"
                ]
            },
            {
                name: "Maps and Directions",
                topics: [
                    "Simple maps",
                    "Landmarks",
                    "Following a route",
                    "Finding places"
                ]
            }
        ]
    }),

    curriculumRecord({
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grade: "3",
        subject: "Social Science",
        splitUp: "Term III",
        chapterNumber: 10,
        chapterName: "Know Your Directions",
        concepts: [
            {
                name: "Directions",
                topics: [
                    "North",
                    "South",
                    "East",
                    "West"
                ]
            },
            {
                name: "Finding Directions",
                topics: [
                    "Sun and directions",
                    "Simple direction activities",
                    "Using landmarks"
                ]
            },
            {
                name: "Maps",
                topics: [
                    "Reading simple maps",
                    "Symbols",
                    "Routes",
                    "Locating places"
                ]
            }
        ]
    })
];


/* =========================================================
   OTHER CURRICULUM DATA
========================================================= */

const CBSE_NCERT = [
    ...CBSE_GRADE_3_OUR_WONDROUS_WORLD,
    ...CBSE_GRADE_3_MATHS_MELA,
    ...CBSE_GRADE_3_SANTOOR,
    ...CBSE_GRADE_3_VEENA
];


const SAMACHEER_KALVI = [
     ...SAMACHEER_GRADE_3_TAMIL,
    ...SAMACHEER_GRADE_3_MATHEMATICS,
    ...SAMACHEER_GRADE_3_SCIENCE,
    ...SAMACHEER_GRADE_3_SOCIAL_SCIENCE
];


/* =========================================================
   SUPPORTED GRADES
========================================================= */

const SUPPORTED_GRADES = Array.from(
    { length: 10 },
    (_, index) => String(index + 3)
);


/* =========================================================
   CURRICULUM TRACKS
========================================================= */

const CURRICULUM_TRACKS = [

    {
        board: "CBSE",
        curriculum: "NCERT",
        academicYear: "2026-27",
        grades: SUPPORTED_GRADES
    },

    {
        board: "Tamil Nadu State Board",
        curriculum: "Samacheer Kalvi",
        academicYear: "2026-27",
        grades: SUPPORTED_GRADES
    }

];


/* =========================================================
   MASTER RECORDS
========================================================= */

const records = [

    ...CBSE_NCERT,

    ...SAMACHEER_KALVI

];


/* =========================================================
   VALIDATION
========================================================= */

function validateMasterData(data) {

    if (!Array.isArray(data)) {

        throw new Error(
            "Master curriculum data must be an array."
        );

    }

    const errors = [];

    data.forEach((record, index) => {

        const requiredFields = [
            "board",
            "curriculum",
            "academicYear",
            "grade",
            "subject",
            "chapterName"
        ];

        requiredFields.forEach(field => {

            if (
                record[field] === undefined ||
                record[field] === null ||
                String(record[field]).trim() === ""
            ) {

                errors.push(
                    `Record ${index + 1}: missing ${field}`
                );

            }

        });

        const gradeNumber =
            Number(record.grade);

        if (
            Number.isNaN(gradeNumber) ||
            gradeNumber < 3 ||
            gradeNumber > 12
        ) {

            errors.push(
                `Record ${index + 1}: grade must be between 3 and 12`
            );

        }

        if (
            record.concepts !== undefined &&
            !Array.isArray(record.concepts)
        ) {

            errors.push(
                `Record ${index + 1}: concepts must be an array`
            );

        }

    });

    if (errors.length > 0) {

        throw new Error(
            "\nMASTER CURRICULUM VALIDATION FAILED:\n" +
            errors.join("\n")
        );

    }

    return true;
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    records,

    curriculumTracks:
        CURRICULUM_TRACKS,

    supportedGrades:
        SUPPORTED_GRADES,

    curriculumRecord,

    validateMasterData

};