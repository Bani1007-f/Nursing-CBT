const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const session = require("express-session");
const crypto = require("crypto");

const db = require("./database/db");
const auth = require("./auth/auth");

const app = express();

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");


// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ============================================
// SERVE WEBSITE
// ============================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ============================================
// USER SESSIONS
// ============================================

app.use(
    session({

        secret:
            process.env.SESSION_SECRET ||
            "cbt-development-secret",

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            httpOnly:
                true,

            maxAge:
                1000 *
                60 *
                60 *
                24 *
                7

        }

    })
);


// ============================================
// SERVE WEBSITE
// ============================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================

const upload =
    multer({

        storage:
            multer.memoryStorage(),

        limits: {
            fileSize:
                5 * 1024 * 1024
        },

        fileFilter:
            (
                req,
                file,
                callback
            ) => {

                const isJson =
                    file.originalname
                        .toLowerCase()
                        .endsWith(".json");


                if (!isJson) {

                    return callback(
                        new Error(
                            "Only JSON files are allowed."
                        )
                    );

                }


                callback(
                    null,
                    true
                );

            }

    });


// ============================================
// HELPER: GET DIRECTORIES
// ============================================

function getDirectories(
    directory
) {

    if (
        !fs.existsSync(directory)
    ) {

        return [];

    }


    return fs.readdirSync(
        directory,
        {
            withFileTypes:
                true
        }
    )
    .filter(
        item =>
            item.isDirectory()
    )
    .map(
        item =>
            item.name
    );

}


// ============================================
// HELPER: GET JSON FILES RECURSIVELY
// ============================================

function getJsonFiles(
    directory
) {

    if (
        !fs.existsSync(directory)
    ) {

        return [];

    }


    let files = [];


    const entries =
        fs.readdirSync(
            directory,
            {
                withFileTypes:
                    true
            }
        );


    for (
        const entry of entries
    ) {

        const fullPath =
            path.join(
                directory,
                entry.name
            );


        if (
            entry.isDirectory()
        ) {

            files =
                files.concat(
                    getJsonFiles(
                        fullPath
                    )
                );

        }

        else if (
            entry.isFile() &&
            entry.name
                .toLowerCase()
                .endsWith(".json")
        ) {

            files.push(
                fullPath
            );

        }

    }


    return files;

}

// ============================================
// NORMALIZE UPLOADED QUESTION
// ============================================

function normalizeUploadedQuestion(question) {

    if (!question || typeof question !== "object") {
        return null;
    }


    // ========================================
    // FORMAT A
    // Question / A / B / C / D / Answer
    // ========================================

    if (
        typeof question.Question === "string" &&
        typeof question.A === "string" &&
        typeof question.B === "string" &&
        typeof question.C === "string" &&
        typeof question.D === "string" &&
        typeof question.Answer === "string"
    ) {

        return {

            question:
                question.Question.trim(),

            options: {

                A: question.A,
                B: question.B,
                C: question.C,
                D: question.D

            },

            answer:
                question.Answer
                    .trim()
                    .toUpperCase(),

            explanation:
                question.Explanation ||
                question.explanation ||
                null

        };

    }


    // ========================================
    // FORMAT B
    // question / options / answer
    // ========================================

    if (
        typeof question.question === "string" &&
        question.options &&
        typeof question.options === "object" &&
        typeof question.answer === "string"
    ) {

        return {

            question:
                question.question.trim(),

            options: {

                A: question.options.A,
                B: question.options.B,
                C: question.options.C,
                D: question.options.D

            },

            answer:
                question.answer
                    .trim()
                    .toUpperCase(),

            explanation:
                question.explanation ||
                null

        };

    }


    // ========================================
    // FORMAT C
    // lowercase question/answer
    // but A/B/C/D directly
    // ========================================

    if (
        typeof question.question === "string" &&
        typeof question.A === "string" &&
        typeof question.B === "string" &&
        typeof question.C === "string" &&
        typeof question.D === "string" &&
        typeof question.answer === "string"
    ) {

        return {

            question:
                question.question.trim(),

            options: {

                A: question.A,
                B: question.B,
                C: question.C,
                D: question.D

            },

            answer:
                question.answer
                    .trim()
                    .toUpperCase(),

            explanation:
                question.explanation ||
                question.Explanation ||
                null

        };

    }


    return null;
}
// ============================================
// READ QUESTION COUNT FROM JSON
// ============================================

function getQuestionCountFromJson(filePath) {

    let questionCount = 0;

    try {

        const content =
            JSON.parse(
                fs.readFileSync(
                    filePath,
                    "utf8"
                )
            );

        if (
            content.questions &&
            Array.isArray(
                content.questions
            )
        ) {

            questionCount =
                content.questions.length;

        }

    }

    catch (error) {

        console.error(
            `Could not read ${filePath}:`,
            error.message
        );

    }

    return questionCount;

}


// ============================================
// READ TEST LENGTH FROM JSON
// ============================================

function getTestQuestionCount(filePath) {

    try {

        const content =
            JSON.parse(
                fs.readFileSync(
                    filePath,
                    "utf8"
                )
            );

        if (
            content.testSettings &&
            Number.isFinite(
                Number(
                    content.testSettings.questionCount
                )
            )
        ) {

            return Number(
                content.testSettings.questionCount
            );

        }

    }

    catch (error) {

        console.error(
            `Could not read test settings from ${filePath}:`,
            error.message
        );

    }

    return getQuestionCountFromJson(
        filePath
    );

}


// ============================================
// CREATE TOPIC ID
// ============================================

function createTopicId(relativePath) {

    return relativePath
        .split(path.sep)
        .map(part => slugify(part))
        .filter(Boolean)
        .join("/");

}




       

// ============================================
// GET QUESTION BANKS FROM TOPIC FOLDER
// ============================================

function getQuestionBanks(topicPath) {

    if (!fs.existsSync(topicPath)) {
        return [];
    }

    const questionBanks = [];

    const entries =
        fs.readdirSync(
            topicPath,
            {
                withFileTypes: true
            }
        );

    for (const entry of entries) {

        if (
            !entry.isFile() ||
            !entry.name
                .toLowerCase()
                .endsWith(".json")
        ) {
            continue;
        }

        const filename =
            entry.name.toLowerCase();

        if (
            filename === "topic.json" ||
            filename.includes("general")
        ) {
            continue;
        }

        const filePath =
            path.join(
                topicPath,
                entry.name
            );

        questionBanks.push({

            id:
                entry.name,

            name:
                entry.name.replace(
                    /\.json$/i,
                    ""
                ),

            file:
                entry.name,

            questionCount:
                getQuestionCountFromJson(
                    filePath
                )

        });

    }

    return questionBanks;

}


// ============================================
// BUILD ONE FILE TOPIC
// ============================================

function buildCatalogFileTopic(
    filePath,
    relativePath
) {

    const topicName =
        path.basename(
            relativePath,
            path.extname(relativePath)
        );

    return {

        id:
             createTopicId(
        topicName
    ),

        name:
            topicName,

        type:
            "file",

        questionCount:
            getTestQuestionCount(
                filePath
            )

    };

}


// ============================================
// BUILD ONE FOLDER TOPIC
// ============================================

function buildCatalogFolderTopic(
    topicPath,
    relativePath
) {

    const questionBanks =
        getQuestionBanks(
            topicPath
        );

    if (
        questionBanks.length === 0
    ) {

        return null;

    }

    let questionCount =
        questionBanks.reduce(
            (
                total,
                bank
            ) =>
                total +
                bank.questionCount,
            0
        );


    // topic.json can override the
    // number of questions used
    // for the test.

    const settingsPath =
        path.join(
            topicPath,
            "topic.json"
        );


    if (
        fs.existsSync(
            settingsPath
        )
    ) {

        try {

            const settings =
                JSON.parse(
                    fs.readFileSync(
                        settingsPath,
                        "utf8"
                    )
                );

            const configuredCount =
                Number(
                    settings.questionCount
                );

            if (
                Number.isFinite(
                    configuredCount
                ) &&
                configuredCount > 0
            ) {

                questionCount =
                    configuredCount;

            }

        }

        catch (error) {

            console.error(
                `Could not read ${settingsPath}:`,
                error.message
            );

        }

    }


    return {

        id:
            createTopicId(
                relativePath
            ),

        name:
            path.basename(
                relativePath
            ),

        type:
            "folder",

        questionCount,

        questionBanks

    };

}


// ============================================
// BUILD CATEGORY
// ============================================

function buildCatalogCategory(
    categoryPath,
    relativePath
) {

    const topics = [];

    const entries =
        fs.readdirSync(
            categoryPath,
            {
                withFileTypes: true
            }
        );


    for (
        const entry of entries
    ) {

        if (
            entry.name.startsWith(".")
        ) {

            continue;

        }


        const fullPath =
            path.join(
                categoryPath,
                entry.name
            );


        const childRelativePath =
            path.join(
                relativePath,
                entry.name
            );


        // ====================================
        // JSON FILE = TOPIC
        // ====================================

        if (
            entry.isFile() &&
            entry.name
                .toLowerCase()
                .endsWith(".json")
        ) {

            const filename =
                entry.name.toLowerCase();


            if (
                filename === "topic.json" ||
                filename.includes("general")
            ) {

                continue;

            }


            const topic =
                buildCatalogFileTopic(
                    fullPath,
                    childRelativePath
                );


            if (topic) {

                topics.push(topic);

            }

            continue;

        }


        // ====================================
        // FOLDER = TOPIC
        // ====================================

        if (
            entry.isDirectory()
        ) {

            const topic =
                buildCatalogFolderTopic(
                    fullPath,
                    childRelativePath
                );


            if (topic) {

                topics.push(topic);

                continue;

            }


            // If it is not a topic folder,
            // check whether it contains
            // nested topics.

            const nestedCategory =
                buildCatalogCategory(
                    fullPath,
                    childRelativePath
                );


            if (
                nestedCategory.topics.length > 0
            ) {

                topics.push(
                    nestedCategory
                );

            }

        }

    }


    return {

        id:
            createTopicId(
                relativePath
            ),

        name:
            path.basename(
                relativePath
            ),

        type:
            "category",

        topics

    };

}

// ============================================
// API: GET COURSES, CATEGORIES AND TOPICS
// ============================================

app.get(
    "/api/catalog",
    (req, res) => {

        try {

            const courseNames =
                getDirectories(
                    DATA_DIR
                );


            const courses =
                courseNames.map(
                    courseName => {

                        const coursePath =
                            path.join(
                                DATA_DIR,
                                courseName
                            );


                        const categories = [];
                        const topics = [];


                        const entries =
                            fs.readdirSync(
                                coursePath,
                                {
                                    withFileTypes:
                                        true
                                }
                            );


                        for (
                            const entry of entries
                        ) {

                            if (
                                entry.name.startsWith(".")
                            ) {

                                continue;

                            }


                            const fullPath =
                                path.join(
                                    coursePath,
                                    entry.name
                                );


                            // ====================================
                            // DIRECT JSON = DIRECT TOPIC
                            // ====================================

                            if (
                                entry.isFile() &&
                                entry.name
                                    .toLowerCase()
                                    .endsWith(".json")
                            ) {

                                const filename =
                                    entry.name.toLowerCase();


                                if (
                                    filename ===
                                    "topic.json"
                                ) {

                                    continue;

                                }


                                if (
                                    filename.includes(
                                        "general"
                                    )
                                ) {

                                    continue;

                                }


                                const topic =
                                    buildCatalogFileTopic(
                                        fullPath,
                                        entry.name
                                    );


                                if (topic) {

                                    topics.push(
                                        topic
                                    );

                                }

                                continue;

                            }


                            // ====================================
                            // DIRECT FOLDER = CATEGORY
                            // ====================================

                            if (
                                entry.isDirectory()
                            ) {

                                const category =
                                    buildCatalogCategory(
                                        fullPath,
                                        entry.name
                                    );


                                if (
                                    category.topics.length >
                                    0
                                ) {

                                    categories.push(
                                        category
                                    );

                                }

                            }

                        }


                        return {

                            id:
                                slugify(
                                    courseName
                                ),

                            name:
                                courseName,

                            categories,

                            topics

                        };

                    }
                );


            return res.json({
                courses
            });

        }

        catch (error) {

            console.error(
                "Catalog error:",
                error
            );


            return res.status(500).json({

                error:
                    "Could not build course catalog."

            });

        }

    }
);



// ============================================
// API: GET QUESTIONS
// ============================================

app.get(
    "/api/questions",
    (req, res) => {

        const course =
            req.query.course;

        const topic =
            req.query.topic;


        // ========================================
        // VALIDATE COURSE
        // ========================================

        if (!course) {

            return res.status(400).json({
                error: "Course is required."
            });

        }


        const courseDirectory =
            findDirectory(
                DATA_DIR,
                course
            );


        if (!courseDirectory) {

            return res.status(404).json({
                error: "Course not found."
            });

        }


        // ========================================
        // GENERAL QUESTIONS
        // ========================================

        if (
            topic === "general"
        ) {

            const generalFiles =
                getJsonFiles(courseDirectory)
                    .filter(file => {

                        const relative =
                            path.relative(
                                courseDirectory,
                                file
                            );

                        // General questions must be
                        // directly inside the course.

                        return (
                            path.dirname(relative) === "." &&
                            path.basename(file)
                                .toLowerCase()
                                .includes("general")
                        );

                    });


            const questions =
                loadQuestionsFromFiles(
                    generalFiles
                );


            const questionLimit = 60;


            if (
                questions.length <
                questionLimit
            ) {

                return res.status(400).json({

                    error:
                        `This test requires ${questionLimit} questions, but only ${questions.length} valid questions are available.`,

                    totalAvailable:
                        questions.length,

                    required:
                        questionLimit

                });

            }


            const selectedQuestions =
                getRandomQuestions(
                    questions,
                    questionLimit
                );


            return res.json({

                course,

                topic,

                totalAvailable:
                    questions.length,

                questionCount:
                    selectedQuestions.length,

                questions:
                    selectedQuestions

            });

        }


        // ========================================
        // TOPIC REQUIRED
        // ========================================

        if (!topic) {

            return res.status(400).json({

                error:
                    "Topic is required."

            });

        }


        // ========================================
        // FIND TOPIC BY PATH
        // ========================================

        /*
            Topic IDs now support paths.

            Example:

            cardiovascular-system/heart-failure

            This allows the same topic name to exist
            under different systems without conflicts.
        */

        const topicParts =
            topic
                .split("/")
                .filter(Boolean);


        let topicDirectory =
            courseDirectory;


        for (
            const part of topicParts
        ) {

            const entries =
                fs.readdirSync(
                    topicDirectory,
                    {
                        withFileTypes: true
                    }
                );


            let foundEntry =
                null;


            for (
                const entry of entries
            ) {

                const entryName =
                    entry.name
                        .replace(
                            /\.json$/i,
                            ""
                        );


                if (
                    slugify(entryName) ===
                    slugify(part)
                ) {

                    foundEntry =
                        entry;

                    break;

                }

            }


            if (!foundEntry) {

                return res.status(404).json({

                    error:
                        `Topic path not found: ${topic}`

                });

            }


            const fullPath =
                path.join(
                    topicDirectory,
                    foundEntry.name
                );


            // ------------------------------------
            // More path remains
            // ------------------------------------

            if (
                part !==
                topicParts[
                    topicParts.length - 1
                ]
            ) {

                if (
                    !foundEntry.isDirectory()
                ) {

                    return res.status(404).json({

                        error:
                            `Invalid topic path: ${topic}`

                    });

                }


                topicDirectory =
                    fullPath;

                continue;

            }


            // ------------------------------------
            // FINAL PART
            // ------------------------------------

            if (
                foundEntry.isFile()
            ) {

                return loadSingleTopicFile(
                    fullPath,
                    course,
                    topic,
                    res
                );

            }


            if (
                foundEntry.isDirectory()
            ) {

                return loadFolderTopic(
                    fullPath,
                    course,
                    topic,
                    res
                );

            }

        }


        return res.status(404).json({

            error:
                "Topic not found."

        });

    }
);

// ============================================
// LOAD SINGLE TOPIC JSON FILE
// ============================================

function loadSingleTopicFile(
    filePath,
    course,
    topic,
    res
) {

    let content;


    try {

        content =
            JSON.parse(
                fs.readFileSync(
                    filePath,
                    "utf8"
                )
            );

    }

    catch (error) {

        console.error(
            `Could not read ${filePath}:`,
            error.message
        );


        return res.status(500).json({

            error:
                "Could not read topic questions."

        });

    }


    let questionLimit = 20;


    // ========================================
    // TEST SETTINGS
    // ========================================

    if (
        content.testSettings
    ) {

        const configuredCount =
            Number(
                content.testSettings
                    .questionCount
            );


        if (
            Number.isFinite(
                configuredCount
            ) &&
            configuredCount > 0
        ) {

            questionLimit =
                configuredCount;

        }

    }


    // ========================================
    // QUESTIONS
    // ========================================

    let questions = [];


    if (
        Array.isArray(
            content.questions
        )
    ) {

        questions =
    content.questions
        .map(
            (question, index) => {

                if (
                    !validateQuestion(
                        question
                    )
                ) {

                    return null;

                }


                const cleanedQuestion =
                    cleanQuestion(
                        question
                    );


                if (
                    !cleanedQuestion.id
                ) {

                    const fileName =
                        path.basename(
                            filePath,
                            path.extname(filePath)
                        );


                    cleanedQuestion.id =
                        `${slugify(fileName)}-${index + 1}`;

                }


                return cleanedQuestion;

            }
        )
        .filter(Boolean);

    }


    // ========================================
    // CHECK AVAILABILITY
    // ========================================

    if (
        questions.length <
        questionLimit
    ) {

        return res.status(400).json({

            error:
                `This test requires ${questionLimit} questions, but only ${questions.length} valid questions are available.`,

            totalAvailable:
                questions.length,

            required:
                questionLimit

        });

    }


    // ========================================
    // RANDOM SELECTION
    // ========================================

    const selectedQuestions =
        getRandomQuestions(
            questions,
            questionLimit
        );


    return res.json({

        course,

        topic,

        totalAvailable:
            questions.length,

        questionCount:
            selectedQuestions.length,

        questions:
            selectedQuestions

    });

}

// ============================================
// LOAD FOLDER TOPIC
// ============================================

function loadFolderTopic(
    topicDirectory,
    course,
    topic,
    res
) {

    let questionLimit = 20;


    // ========================================
    // READ TOPIC SETTINGS
    // ========================================

    const settingsPath =
        path.join(
            topicDirectory,
            "topic.json"
        );


    if (
        fs.existsSync(
            settingsPath
        )
    ) {

        try {

            const settings =
                JSON.parse(
                    fs.readFileSync(
                        settingsPath,
                        "utf8"
                    )
                );


            const configuredCount =
                Number(
                    settings.questionCount
                );


            if (
                Number.isFinite(
                    configuredCount
                ) &&
                configuredCount > 0
            ) {

                questionLimit =
                    configuredCount;

            }

        }

        catch (error) {

            console.error(
                `Could not read ${settingsPath}:`,
                error.message
            );

        }

    }


    // ========================================
    // LOAD ALL QUESTION BANKS
    // ========================================

    const files =
        getJsonFiles(
            topicDirectory
        )
        .filter(
            file =>
                path.basename(file)
                    .toLowerCase() !==
                "topic.json"
        );


    const questions =
        loadQuestionsFromFiles(
            files
        );


    // ========================================
    // CHECK AVAILABILITY
    // ========================================

    if (
        questions.length <
        questionLimit
    ) {

        return res.status(400).json({

            error:
                `This test requires ${questionLimit} questions, but only ${questions.length} valid questions are available.`,

            totalAvailable:
                questions.length,

            required:
                questionLimit

        });

    }


    // ========================================
    // RANDOM SELECTION
    // ========================================

    const selectedQuestions =
        getRandomQuestions(
            questions,
            questionLimit
        );


    return res.json({

        course,

        topic,

        totalAvailable:
            questions.length,

        questionCount:
            selectedQuestions.length,

        questions:
            selectedQuestions

    });

}

// ============================================
// LOAD QUESTIONS FROM JSON FILES
// ============================================

function loadQuestionsFromFiles(
    files
) {

    let questions = [];


    for (
        const file of files
    ) {

        try {

            const content =
                JSON.parse(
                    fs.readFileSync(
                        file,
                        "utf8"
                    )
                );


            if (
                !content.questions ||
                !Array.isArray(
                    content.questions
                )
            ) {

                console.warn(
                    `Skipping ${file}: no questions array found.`
                );

                continue;

            }


            content.questions.forEach(
                (question, index) => {

                    if (
                        !validateQuestion(
                            question
                        )
                    ) {

                        console.warn(
                            `Skipping invalid question ${index + 1} in ${file}`
                        );

                        return;

                    }


                    const cleanedQuestion =
                        cleanQuestion(
                            question
                        );


                    // ========================================
                    // STABLE QUESTION ID
                    // ========================================

                    /*
                        Questions do not need an "id" field
                        in the JSON file.

                        The server creates a stable ID based on:
                        - the source file
                        - the original question position
                    */

                    if (
                        !cleanedQuestion.id
                    ) {

                        const fileName =
                            path.basename(
                                file,
                                path.extname(file)
                            );


                        cleanedQuestion.id =
                            `${slugify(fileName)}-${index + 1}`;

                    }


                    questions.push(
                        cleanedQuestion
                    );

                }
            );

        }

        catch (error) {

            console.error(
                `Could not read ${file}:`,
                error.message
            );

        }

    }


    return questions;

}


// ============================================
// CLEAN QUESTION
// ============================================

function cleanQuestion(
    question
) {

    let questionId =
        question.id;


    if (!questionId) {

        const source =
            JSON.stringify({

                question:
                    question.question,

                options:
                    question.options,

                answer:
                    question.answer

            });


        questionId =
            crypto
                .createHash("sha256")
                .update(source)
                .digest("hex")
                .slice(0, 16);

    }


    return {

        id:
            questionId,

        question:
            question.question,

        options:
            question.options,

        answer:
            question.answer,

        explanation:
            question.explanation ||
            null

    };

}


// ============================================
// VALIDATE QUESTION
// ============================================

function validateQuestion(
    question
) {

    if (!question) {

        return false;

    }


    if (
        typeof question.question !==
            "string" ||
        question.question.trim() ===
            ""
    ) {

        return false;

    }


    if (
        !question.options ||
        typeof question.options !==
            "object"
    ) {

        return false;

    }


    const requiredOptions = [
        "A",
        "B",
        "C",
        "D"
    ];


    for (
        const letter of
            requiredOptions
    ) {

        if (
            typeof question.options[
                letter
            ] !== "string" ||

            question.options[
                letter
            ].trim() === ""
        ) {

            return false;

        }

    }


    if (
        ![
            "A",
            "B",
            "C",
            "D"
        ].includes(
            question.answer
        )
    ) {

        return false;

    }


    return true;

}


// ============================================
// RANDOM QUESTION SELECTION
// ============================================

function getRandomQuestions(
    questions,
    amount
) {

    const shuffled =
        [...questions];


    // Fisher-Yates shuffle

    for (
        let i =
            shuffled.length - 1;

        i > 0;

        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            shuffled[i],
            shuffled[j]
        ] =
        [
            shuffled[j],
            shuffled[i]
        ];

    }


    return shuffled.slice(
        0,
        amount
    );

}


// ============================================
// FIND DIRECTORY
// ============================================

function findDirectory(
    parent,
    target
) {

    const directories =
        getDirectories(
            parent
        );


    return directories
        .map(
            name => ({

                name,

                fullPath:
                    path.join(
                        parent,
                        name
                    )

            })
        )
        .find(
          item =>
            slugify(item.name) ===
            slugify(target)
)
        ?.fullPath ||
        null;

}


// ============================================
// SLUGIFY
// ============================================

function slugify(
    text
) {

    return text
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
        );

}


// ============================================
// API: UPLOAD QUESTIONS
// ============================================

app.post(
    "/api/upload-questions",
    upload.single("questionFile"),
    (req, res) => {

        try {

            // ========================================
            // CHECK FILE
            // ========================================

            if (!req.file) {

                return res.status(400).json({

                    error:
                        "No JSON file was uploaded."

                });

            }


            // ========================================
            // COURSE / TOPIC
            // ========================================

            const selectedCourse =
                req.body.course;

            const selectedTopic =
                req.body.topic;

            const creatingNewTopic =
                req.body.creatingNewTopic ===
                "true";


          
// ========================================
// VALIDATE COURSE
// ========================================

if (!selectedCourse) {

    return res.status(400).json({
        error:
            "Course is required."
    });

}

// ========================================
// VALIDATE TOPIC
// ========================================
// Existing topic uploads require a topic.
// New topic uploads use newTopicName instead.

if (
    !creatingNewTopic &&
    !selectedTopic
) {

    return res.status(400).json({
        error:
            "Topic is required."
    });

}

            // ========================================
            // FIND COURSE
            // ========================================

            const courseDirectory =
                findDirectory(
                    DATA_DIR,
                    selectedCourse
                );


            if (!courseDirectory) {

                return res.status(404).json({

                    error:
                        "Course not found."

                });

            }


            // ========================================
            // PARSE JSON
            // ========================================

            let uploadedData;


            try {

                uploadedData =
                    JSON.parse(
                        req.file.buffer.toString(
                            "utf8"
                        )
                    );

            }

            catch (error) {

                return res.status(400).json({

                    error:
                        "The uploaded file is not valid JSON."

                });

            }


            // ========================================
            // QUESTIONS ARRAY
            // ========================================

            if (
                !uploadedData.questions ||
                !Array.isArray(
                    uploadedData.questions
                )
            ) {

                return res.status(400).json({

                    error:
                        "The JSON must contain a questions array."

                });

            }


            if (
                uploadedData.questions.length ===
                0
            ) {

                return res.status(400).json({

                    error:
                        "The questions array is empty."

                });

            }


            // ========================================
            // VALIDATE QUESTIONS
            // ========================================

            const validQuestions =
                [];

            const invalidQuestions =
                [];


            uploadedData.questions.forEach(
                (question, index) => {

                   const normalizedQuestion =
    normalizeUploadedQuestion(question);


if (
    normalizedQuestion &&
    validateQuestion(normalizedQuestion)
) {

    validQuestions.push(
        cleanQuestion(normalizedQuestion)
    );

}



                    else {

                        invalidQuestions.push(
                            index + 1
                        );

                    }

                }
            );


            // ========================================
            // REJECT INVALID UPLOAD
            // ========================================

            if (
                invalidQuestions.length >
                0
            ) {

                return res.status(400).json({

                    error:
                        "Upload rejected because some questions are invalid.",

                    invalidQuestions,

                    totalSubmitted:
                        uploadedData
                            .questions
                            .length,

                    validQuestions:
                        validQuestions.length

                });

            }


           


            // ========================================
            // CREATE NEW TOPIC
            // ========================================

            if (
                creatingNewTopic
            ) {

                const newTopicName =
                    req.body.newTopicName;


                const newTopicQuestionCount =
                    Number(
                        req.body
                            .newTopicQuestionCount
                    );


                if (
                    !newTopicName ||
                    newTopicName.trim() ===
                        ""
                ) {

                    return res.status(400).json({

                        error:
                            "New topic name is required."

                    });

                }


                if (
                        !Number.isInteger(
                            newTopicQuestionCount
                        ) ||
                        newTopicQuestionCount <= 0
                    ) {

                        return res.status(400).json({

                            error:
                                "Question count must be a positive whole number."

                        });
                    }





    // ========================================
    // DETERMINE CATEGORY DIRECTORY
    // ========================================

    const categoryId =
        req.body.category;

    let categoryDirectory =
        courseDirectory;


    if (
        categoryId &&
        categoryId.trim() !== ""
    ) {

        const categoryResult =
            findTopicPath(
                courseDirectory,
                categoryId
            );


        if (
            !categoryResult ||
            !categoryResult.entry.isDirectory()
        ) {

            return res.status(404).json({

                error:
                    "Selected category was not found."

            });

        }


        categoryDirectory =
            categoryResult.path;

    }


    return createNewTopic(
        categoryDirectory,
        selectedCourse,
        newTopicName.trim(),
        uploadedData,
        validQuestions,
        newTopicQuestionCount,
        res
    );

}




// ========================================
// FIND EXISTING TOPIC
// ========================================


const categoryId =
    req.body.category || "";

let topicSearchDirectory =
    courseDirectory;

// ========================================
// CATEGORY SELECTED
// ========================================

if (
    categoryId.trim() !== ""
) {

    const categoryResult =
        findTopicPath(
            courseDirectory,
            categoryId
        );


    if (
        !categoryResult ||
        !categoryResult.entry.isDirectory()
    ) {

        return res.status(404).json({

            error:
                "Selected category was not found."

        });

    }


    topicSearchDirectory =
        categoryResult.path;

}

// ========================================
// FIND TOPIC
// ========================================

const topicResult =
    findTopicPath(
        topicSearchDirectory,
        selectedTopic
    );

// ========================================
// NEW TOPIC
// ========================================

if (!topicResult) {

    const newTopicName =
        req.body.newTopicName ||
        uploadedData.topic;


    const newTopicQuestionCount =
        Number(
            req.body.newTopicQuestionCount ||
            uploadedData?.testSettings?.questionCount ||
            20
        );


    if (
        !newTopicName ||
        newTopicName.trim() === ""
    ) {

        return res.status(400).json({

            error:
                "New topic name is required."

        });

    }


    if (
        !Number.isFinite(
            newTopicQuestionCount
        ) ||
        newTopicQuestionCount <= 0
    ) {

        return res.status(400).json({

            error:
                "Question count must be a positive number."

        });

    }


    // ----------------------------------------
    // DETERMINE CATEGORY DIRECTORY
    // ----------------------------------------

    const categoryId =
        req.body.category;


    let categoryDirectory =
        courseDirectory;


    if (
        categoryId &&
        categoryId.trim() !== ""
    ) {

        const categoryResult =
            findTopicPath(
                courseDirectory,
                categoryId
            );


        if (
            !categoryResult ||
            !categoryResult.entry.isDirectory()
        ) {

            return res.status(404).json({

                error:
                    "Selected category was not found."

            });

        }


        categoryDirectory =
            categoryResult.path;

    }


    return createNewTopic(
        categoryDirectory,
        selectedCourse,
        newTopicName.trim(),
        uploadedData,
        validQuestions,
        newTopicQuestionCount,
        res
    );

}


// ========================================
// EXISTING TOPIC
// ========================================

const topicEntry =
    topicResult.entry;


const topicPath =
    topicResult.path;


// ========================================
// EXISTING JSON TOPIC
// ========================================

if (
    topicEntry.isFile()
) {

    return appendToJsonTopic(
        topicResult.parentDirectory,
        topicEntry,
        validQuestions,
        res
    );

}


// ========================================
// EXISTING FOLDER TOPIC
// ========================================

    if (
    topicEntry.isDirectory()
    ) {

    const questionFile =
        req.body.targetFile;


    if (
        !questionFile
    ) {

        return res.status(400).json({

            error:
                "This topic contains multiple question banks. A question file must be selected."

        });

    }


    return appendToFolderTopic(
        topicResult.parentDirectory,
        topicEntry,
        questionFile,
        validQuestions,
        res
    );

    }


    return res.status(400).json({

         error:
        "Unable to determine topic type."

    });
}
catch (error) {

            console.error(
                "Upload error:",
                error
            );

            return res.status(500).json({

                error:
                    "An unexpected error occurred during upload."

            });

        }

    }
);



// ============================================
// FIND TOPIC PATH RECURSIVELY
// ============================================

function findTopicPath(
    directory,
    topicId,
    parentDirectory = directory
) {

    if (
        !fs.existsSync(directory)
    ) {

        return null;

    }


    const entries =
        fs.readdirSync(
            directory,
            {
                withFileTypes: true
            }
        );


    for (
        const entry of entries
    ) {

        if (
            entry.name.startsWith(".")
        ) {

            continue;

        }


        const fullPath =
            path.join(
                directory,
                entry.name
            );


        const relativePath =
            path.relative(
                parentDirectory,
                fullPath
            );


        const nameWithoutExtension =
            entry.name.replace(
                /\.json$/i,
                ""
            );


        const possibleIds = [

            createTopicId(
                relativePath
            ),

            slugify(
                nameWithoutExtension
            )

        ];


        if (
    possibleIds.some(
        id =>
            slugify(id) ===
            slugify(topicId)
    )
) {

            return {

                entry,

                path:
                    fullPath,

                parentDirectory:
                    directory

            };

        }


        if (
            entry.isDirectory()
        ) {

            const result =
                findTopicPath(
                    fullPath,
                    topicId,
                    parentDirectory
                );


            if (result) {

                return result;

            }

        }

    }


    return null;

}

// ============================================
// CREATE NEW TOPIC
// ============================================

function createNewTopic(
    parentDirectory,
    courseName,
    topicName,
    uploadedData,
    questions,
    questionCount,
    res
) {

    // ----------------------------------------
    // MAKE SURE COURSE MATCHES
    // ----------------------------------------

    if (
        uploadedData.course &&
        slugify(
            uploadedData.course
        ) !==
        slugify(
            courseName
        )
    ) {

        return res.status(400).json({

            error:
                "The course in the JSON does not match the selected course."

        });

    }


    // ----------------------------------------
    // VALIDATE QUESTION COUNT
    // ----------------------------------------

    if (
        !Number.isFinite(
            Number(questionCount)
        ) ||
        Number(questionCount) <= 0
    ) {

        return res.status(400).json({

            error:
                "Question count must be a positive number."

        });

    }


    // ----------------------------------------
    // MAKE SURE DIRECTORY EXISTS
    // ----------------------------------------

    if (
        !fs.existsSync(
            parentDirectory
        )
    ) {

        return res.status(404).json({

            error:
                "The selected destination folder does not exist."

        });

    }


    // ----------------------------------------
    // GENERATE QUESTION IDs
    // ----------------------------------------

    const prefix =
        createIdPrefix(
            topicName
        );


    const questionsWithIds =
        assignQuestionIds(
            questions,
            prefix,
            []
        );


    // ----------------------------------------
    // FILE NAME
    // ----------------------------------------

    const filename =
        `${slugify(
            topicName
        )}.json`;


    const destination =
        path.join(
            parentDirectory,
            filename
        );


    // ----------------------------------------
    // CHECK EXISTING FILE
    // ----------------------------------------

    if (
        fs.existsSync(
            destination
        )
    ) {

        return res.status(409).json({

            error:
                "A topic with this name already exists."

        });

    }


    // ----------------------------------------
    // CREATE TOPIC DATA
    // ----------------------------------------

    const newTopicData = {

        course:
            courseName,

        topic:
            topicName,

        testSettings: {

            questionCount:
                Number(questionCount)

        },

        questions:
            questionsWithIds

    };


    // ----------------------------------------
    // SAVE
    // ----------------------------------------

    try {

        fs.writeFileSync(

            destination,

            JSON.stringify(
                newTopicData,
                null,
                4
            ),

            "utf8"

        );

    }

    catch (error) {

        console.error(
            "Could not create topic:",
            error
        );


        return res.status(500).json({

            error:
                "Could not save the new topic."

        });

    }


    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return res.json({

        success:
            true,

        action:
            "created",

        message:
            `New topic "${topicName}" created with ${questions.length} questions.`,

        topic:
            topicName,

        questionCount:
            Number(questionCount),

        questionsAdded:
            questions.length,

        file:
            filename

    });

}


// ============================================
// APPEND TO EXISTING JSON TOPIC
// ============================================

function appendToJsonTopic(
    courseDirectory,
    topicEntry,
    newQuestions,
    res
) {

    const filePath =
        path.join(
            courseDirectory,
            topicEntry.name
        );


    let existingData;


    // ----------------------------------------
    // READ EXISTING FILE
    // ----------------------------------------

    try {

        existingData =
            JSON.parse(
                fs.readFileSync(
                    filePath,
                    "utf8"
                )
            );

    }

    catch (error) {

        return res.status(500).json({

            error:
                "Could not read the existing topic file."

        });

    }


    // ----------------------------------------
    // VALID QUESTIONS ARRAY
    // ----------------------------------------

    if (
        !existingData.questions ||
        !Array.isArray(
            existingData.questions
        )
    ) {

        return res.status(400).json({

            error:
                "The existing topic file does not contain a valid questions array."

        });

    }


   


    // ----------------------------------------
    // PREFIX
    // ----------------------------------------

    const topicName =
        topicEntry.name.replace(
            /\.json$/i,
            ""
        );


    const prefix =
        createIdPrefix(
            topicName
        );


    // ----------------------------------------
    // IDS
    // ----------------------------------------

    const questionsWithIds =
        assignQuestionIds(
            questionsToAdd,
            prefix,
            existingData.questions
        );


    // ----------------------------------------
    // APPEND
    // ----------------------------------------

    existingData.questions.push(
        ...questionsWithIds
    );


    // ----------------------------------------
    // SAVE
    // ----------------------------------------

    try {

        fs.writeFileSync(

            filePath,

            JSON.stringify(
                existingData,
                null,
                4
            ),

            "utf8"

        );

    }

    catch (error) {

        console.error(
            "Could not save topic:",
            error
        );


        return res.status(500).json({

            error:
                "Could not save the updated topic."

        });

    }


    return res.json({

        success:
            true,

        action:
            "updated",

        message:
            `${questionsWithIds.length} questions added successfully.`,

        questionsAdded:
            questionsWithIds.length,

       

        totalQuestions:
            existingData.questions.length,

        file:
            topicEntry.name

    });

}


// ============================================
// APPEND TO FOLDER TOPIC
// ============================================

function appendToFolderTopic(
    courseDirectory,
    topicEntry,
    questionFile,
    newQuestions,
    res
) {

    const topicDirectory =
        path.join(
            courseDirectory,
            topicEntry.name
        );


    // ----------------------------------------
    // SECURITY
    // ----------------------------------------

    const safeFilename =
        path.basename(
            questionFile
        );


    const filePath =
        path.join(
            topicDirectory,
            safeFilename
        );


    if (
        !fs.existsSync(
            filePath
        )
    ) {

        return res.status(404).json({

            error:
                "Question bank file not found."

        });

    }


    let existingData;


    // ----------------------------------------
    // READ
    // ----------------------------------------

    try {

        existingData =
            JSON.parse(
                fs.readFileSync(
                    filePath,
                    "utf8"
                )
            );

    }

    catch (error) {

        return res.status(500).json({

            error:
                "Could not read the question bank file."

        });

    }


    // ----------------------------------------
    // VALID ARRAY
    // ----------------------------------------

    if (
        !existingData.questions ||
        !Array.isArray(
            existingData.questions
        )
    ) {

        return res.status(400).json({

            error:
                "The selected file does not contain a valid questions array."

        });

    }


   


    // ----------------------------------------
    // ID PREFIX
    // ----------------------------------------

    const bankName =
        path.basename(
            safeFilename,
            ".json"
        );


    const prefix =
        createIdPrefix(
            bankName
        );


    // ----------------------------------------
    // IDS
    // ----------------------------------------

    const questionsWithIds =
        assignQuestionIds(
            questionsToAdd,
            prefix,
            existingData.questions
        );


    // ----------------------------------------
    // APPEND
    // ----------------------------------------

    existingData.questions.push(
        ...questionsWithIds
    );


    // ----------------------------------------
    // SAVE
    // ----------------------------------------

    try {

        fs.writeFileSync(

            filePath,

            JSON.stringify(
                existingData,
                null,
                4
            ),

            "utf8"

        );

    }

    catch (error) {

        console.error(
            "Could not save question bank:",
            error
        );


        return res.status(500).json({

            error:
                "Could not save the updated question bank."

        });

    }


    return res.json({

        success:
            true,

        action:
            "updated",

        message:
            `${questionsWithIds.length} questions added successfully.`,

        questionsAdded:
            questionsWithIds.length,

      

        totalQuestions:
            existingData.questions.length,

        file:
            safeFilename

    });

}


// ============================================
// CREATE ID PREFIX
// ============================================

function createIdPrefix(
    name
) {

    const words =
        name
            .trim()
            .split(/\s+/);


    let prefix;


    if (
        words.length ===
        1
    ) {

        prefix =
            words[0]
                .replace(
                    /[^a-zA-Z0-9]/g,
                    ""
                )
                .substring(
                    0,
                    4
                );

    }

    else {

        prefix =
            words
                .map(
                    word =>
                        word[0]
                )
                .join("");

    }


    prefix =
        prefix
            .toUpperCase()
            .substring(
                0,
                5
            );


    return prefix ||
        "Q";

}


// ============================================
// ASSIGN QUESTION IDS
// ============================================

function assignQuestionIds(
    questions,
    prefix,
    existingQuestions
) {

    const highestNumber =
        getHighestQuestionNumber(
            existingQuestions,
            prefix
        );


    return questions.map(
        (
            question,
            index
        ) => {

            return {

                id:
                    `${prefix}-${String(
                        highestNumber +
                        index +
                        1
                    ).padStart(
                        3,
                        "0"
                    )}`,

                question:
                    question.question,

                options:
                    question.options,

                answer:
                    question.answer,

                explanation:
                    question.explanation ||
                    null

            };

        }
    );

}


// ============================================
// FIND HIGHEST QUESTION NUMBER
// ============================================

function getHighestQuestionNumber(
    questions,
    prefix
) {

    let highest =
        0;


    for (
        const question of
            questions
    ) {

        if (
            !question.id ||
            typeof question.id !==
                "string"
        ) {

            continue;

        }


        const match =
            question.id.match(
                new RegExp(
                    `^${prefix}-(\\d+)$`,
                    "i"
                )
            );


        if (!match) {

            continue;

        }


        const number =
            parseInt(
                match[1],
                10
            );


        if (
            number >
            highest
        ) {

            highest =
                number;

        }

    }


    return highest;

}


// ============================================
// NORMALIZE QUESTION TEXT
// ============================================

function normalizeQuestionText(
    text
) {

    return String(text)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^\w\s]/g, "");

}




// ============================================
// FIND QUESTION BY ID
// ============================================

function findQuestionById(
    course,
    topic,
    questionId
) {

    const courseDirectory =
        findDirectory(
            DATA_DIR,
            course
        );


    if (!courseDirectory) {

        return null;

    }


   // ========================================
    // RESOLVE TOPIC PATH
    // ========================================

    const topicParts =
        topic
            .split("/")
            .filter(Boolean);


    let topicDirectory =
        courseDirectory;


    for (
        const part of topicParts
    ) {

        const entries =
            fs.readdirSync(
                topicDirectory,
                {
                    withFileTypes: true
                }
            );


        const foundEntry =
            entries.find(
                entry =>
                    slugify(
                        entry.name.replace(
                            /\.json$/i,
                            ""
                        )
                    ) ===
                    slugify(part)
            );


        if (!foundEntry) {

            return null;

        }


        topicDirectory =
            path.join(
                topicDirectory,
                foundEntry.name
            );

    }


    // ========================================
    // TOPIC IS A SINGLE JSON FILE
    // ========================================

    if (
        fs.existsSync(topicDirectory) &&
        fs.statSync(topicDirectory).isFile()
    ) {

        return findQuestionInFile(
            topicDirectory,
            questionId
        );

    }


    // ========================================
    // TOPIC IS A DIRECTORY
    // ========================================

    if (
        !fs.existsSync(topicDirectory) ||
        !fs.statSync(topicDirectory).isDirectory()
    ) {

        return null;

    }


    const files =
        getJsonFiles(
            topicDirectory
        )
        .filter(
            file =>
                path.basename(file)
                    .toLowerCase() !==
                "topic.json"
        );


    for (
        const file of files
    ) {

        const question =
            findQuestionInFile(
                file,
                questionId
            );


        if (question) {

            return question;

        }

    }


    return null;

}

// ============================================
// FIND QUESTION IN FILE
// ============================================

function findQuestionInFile(
    filePath,
    questionId
) {

    try {

        const content =
            JSON.parse(
                fs.readFileSync(
                    filePath,
                    "utf8"
                )
            );


        if (
            !Array.isArray(
                content.questions
            )
        ) {

            return null;

        }


        const fileName =
            path.basename(
                filePath,
                path.extname(filePath)
            );


        for (
            let index = 0;
            index < content.questions.length;
            index++
        ) {

            const rawQuestion =
                content.questions[index];


            if (
                !validateQuestion(
                    rawQuestion
                )
            ) {

                continue;

            }


            const cleanedQuestion =
                cleanQuestion(
                    rawQuestion
                );


            // ====================================
            // USE EXPLICIT ID IF ONE EXISTS
            // ====================================

            if (
                !cleanedQuestion.id
            ) {

                cleanedQuestion.id =
                    `${slugify(fileName)}-${index + 1}`;

            }


            if (
                cleanedQuestion.id ===
                questionId
            ) {

                return cleanedQuestion;

            }

        }

    }

    catch (error) {

        console.error(
            `Could not read ${filePath}:`,
            error.message
        );

    }


    return null;

}
// ============================================
// AUTHENTICATION API
// ============================================


// ============================================
// REGISTER
// ============================================

app.post(
    "/api/auth/register",
    (req, res) => {

        try {

            const {
                name,
                email,
                password
            } = req.body;


            const result =
                auth.registerUser(
                    name || "",
                    email || "",
                    password || ""
                );


            if (!result.success) {

                return res.status(400).json(
                    result
                );

            }


            // Automatically log
            // the new user in.

            req.session.userId =
                result.user.id;


            return res.status(201).json({

                success:
                    true,

                user:
                    result.user

            });

        }

        catch (error) {

            console.error(
                "Registration route error:",
                error
            );


            return res.status(500).json({

                error:
                    "An unexpected error occurred."

            });

        }

    }
);


// ============================================
// LOGIN
// ============================================

app.post(
    "/api/auth/login",
    (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    error:
                        "Email and password are required."

                });

            }


            const result =
                auth.loginUser(
                    email,
                    password
                );


            if (!result.success) {

                return res.status(401).json(
                    result
                );

            }


            req.session.userId =
                result.user.id;


            return res.json({

                success:
                    true,

                user:
                    result.user

            });

        }

        catch (error) {

            console.error(
                "Login route error:",
                error
            );


            return res.status(500).json({

                error:
                    "An unexpected error occurred."

            });

        }

    }
);


// ============================================
// CURRENT USER
// ============================================

app.get(
    "/api/auth/me",
    (req, res) => {

        if (
            !req.session.userId
        ) {

            return res.json({

                authenticated:
                    false

            });

        }


        const user =
            auth.getUserById(
                req.session.userId
            );


        if (!user) {

            req.session.destroy(
                () => {}
            );


            return res.json({

                authenticated:
                    false

            });

        }


        return res.json({

            authenticated:
                true,

            user

        });

    }
);


// ============================================
// LOGOUT
// ============================================

app.post(
    "/api/auth/logout",
    (req, res) => {

        req.session.destroy(
            error => {

                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    return res.status(500).json({

                        error:
                            "Could not log out."

                    });

                }


                res.clearCookie(
                    "connect.sid"
                );


                return res.json({

                    success:
                        true

                });

            }
        );

    }
);

// ============================================
// SAVE TEST ATTEMPT
// ============================================

app.post(
    "/api/attempts",
    (req, res) => {

        try {

            // ========================================
            // REQUIRE LOGIN
            // ========================================

            if (!req.session.userId) {

                return res.status(401).json({

                    error:
                        "You must be logged in to save a test result."

                });

            }


            // ========================================
            // GET SUBMITTED DATA
            // ========================================

            const {
                course,
                topic,
                score,
                totalQuestions,
                percentage,
                timeTaken,
                questions
            } = req.body;


            // ========================================
            // VALIDATE BASIC DATA
            // ========================================

            if (
                !course ||
                !topic
            ) {

                return res.status(400).json({

                    error:
                        "Course and topic are required."

                });

            }


            if (
                !Number.isInteger(score) ||
                !Number.isInteger(totalQuestions) ||
                totalQuestions <= 0
            ) {

                return res.status(400).json({

                    error:
                        "Invalid score information."

                });

            }


            if (
                !Array.isArray(questions)
            ) {

                return res.status(400).json({

                    error:
                        "Question results are required."

                });

            }


            // ========================================
            // CREATE ATTEMPT
            // ========================================

            const createAttempt =
                db.prepare(`
                    INSERT INTO test_attempts (
                        user_id,
                        course,
                        topic,
                        score,
                        total_questions,
                        percentage,
                        time_taken
                    )
                    VALUES (
                        @user_id,
                        @course,
                        @topic,
                        @score,
                        @total_questions,
                        @percentage,
                        @time_taken
                    )
                `);


            const attemptResult =
                createAttempt.run({

                    user_id:
    req.session.userId || null,

                    course:
                        course,

                    topic:
                        topic,

                    score:
                        score,

                    total_questions:
                        totalQuestions,

                    percentage:
                        Number(percentage),

                    time_taken:
                        Number.isFinite(
                            Number(timeTaken)
                        )
                            ? Number(timeTaken)
                            : null

                });


            const attemptId =
                attemptResult.lastInsertRowid;


            // ========================================
            // SAVE INDIVIDUAL QUESTIONS
            // ========================================

            const createQuestion =
                db.prepare(`
                    INSERT INTO attempt_questions (
                        attempt_id,
                        question_id,
                        selected_answer,
                        correct_answer,
                        is_correct
                    )
                    VALUES (
                        @attempt_id,
                        @question_id,
                        @selected_answer,
                        @correct_answer,
                        @is_correct
                    )
                `);


            const saveQuestions =
                db.transaction(
                    questionResults => {

                        for (
                            const question
                            of questionResults
                        ) {

                            createQuestion.run({

                                attempt_id:
                                    attemptId,

                                question_id:
                                    question.questionId ||
                                    null,

                                selected_answer:
                                    question.selectedAnswer ||
                                    null,

                                correct_answer:
                                    question.correctAnswer ||
                                    null,

                                is_correct:
                                    question.isCorrect
                                        ? 1
                                        : 0

                            });

                        }

                    }
                );


            saveQuestions(
                questions
            );


            // ========================================
            // GET SAVED ATTEMPT
            // ========================================

            const savedAttempt =
                db.prepare(`
                    SELECT
                        id,
                        user_id,
                        course,
                        topic,
                        score,
                        total_questions,
                        percentage,
                        time_taken,
                        completed_at
                    FROM test_attempts
                    WHERE id = ?
                `).get(
                    attemptId
                );


           return res.status(201).json({

    success:
        true,

    attemptId:
        savedAttempt.id,

    course:
        savedAttempt.course,

    topic:
        savedAttempt.topic,

    score:
        savedAttempt.score,

    totalQuestions:
        savedAttempt.total_questions,

    percentage:
        savedAttempt.percentage,

    timeTaken:
        savedAttempt.time_taken,

    attempt:
        savedAttempt

});

        }

        catch (error) {

            console.error(
                "Save attempt error:",
                error
            );


            return res.status(500).json({

                error:
                    "Could not save test result."

            });

        }

    }
);

// ============================================
// GET CURRENT USER'S TEST HISTORY
// ============================================

app.get(
    "/api/attempts",
    (req, res) => {

        try {

            // ========================================
            // REQUIRE LOGIN
            // ========================================

            if (!req.session.userId) {

                return res.status(401).json({

                    error:
                        "You must be logged in to view test history."

                });

            }


            // ========================================
            // GET USER ATTEMPTS
            // ========================================

            const attempts =
                db.prepare(`
                    SELECT
                        id,
                        course,
                        topic,
                        score,
                        total_questions,
                        percentage,
                        time_taken,
                        completed_at
                    FROM test_attempts
                    WHERE user_id = ?
                    ORDER BY completed_at DESC
                `).all(
                    req.session.userId
                );


            return res.json({

                success:
                    true,

                attempts

            });

        }

        catch (error) {

            console.error(
                "Get attempt history error:",
                error
            );


            return res.status(500).json({

                error:
                    "Could not load test history."

            });

        }

    }
);

// ============================================
// GET SINGLE TEST ATTEMPT
// ============================================

app.get(
    "/api/attempts/:id",
    (req, res) => {

        try {

            // ========================================
            // REQUIRE LOGIN
            // ========================================

            if (!req.session.userId) {

                return res.status(401).json({

                    error:
                        "You must be logged in to view this result."

                });

            }


            const attemptId =
                Number(req.params.id);


            if (
                !Number.isInteger(attemptId) ||
                attemptId <= 0
            ) {

                return res.status(400).json({

                    error:
                        "Invalid attempt ID."

                });

            }


            // ========================================
            // GET ATTEMPT
            // ========================================

            const attempt =
                db.prepare(`
                    SELECT
                        id,
                        user_id,
                        course,
                        topic,
                        score,
                        total_questions,
                        percentage,
                        time_taken,
                        completed_at
                    FROM test_attempts
                    WHERE id = ?
                    AND user_id = ?
                `).get(
                    attemptId,
                    req.session.userId
                );


            if (!attempt) {

                return res.status(404).json({

                    error:
                        "Test attempt not found."

                });

            }


            // ========================================
            // GET SAVED QUESTIONS
            // ========================================

            const questionResults =
                db.prepare(`
                    SELECT
                        id,
                        question_id,
                        selected_answer,
                        correct_answer,
                        is_correct
                    FROM attempt_questions
                    WHERE attempt_id = ?
                    ORDER BY id ASC
                `).all(
                    attemptId
                );

                const questions =
    questionResults.map(
        result => {

            const question =
                findQuestionById(
                    attempt.course,
                    attempt.topic,
                    result.question_id
                );


            return {

                questionId:
                    result.question_id,

                question:
                    question
                        ? question.question
                        : null,

                options:
                    question
                        ? question.options
                        : null,

                explanation:
                    question
                        ? question.explanation
                        : null,

                selectedAnswer:
                    result.selected_answer,

                correctAnswer:
                    result.correct_answer,

                isCorrect:
                    Boolean(
                        result.is_correct
                    )

            };

        }
    );


            // ========================================
            // RETURN ATTEMPT
            // ========================================

            return res.json({

                success:
                    true,

                attempt:
                    attempt,

                questions:
    questions

            });

        }

        catch (error) {

            console.error(
                "Get attempt error:",
                error
            );


            return res.status(500).json({

                error:
                    "Could not load test result."

            });

        }

    }
);

// ============================================
// USER DASHBOARD
// ============================================

app.get(
    "/api/dashboard",
    (req, res) => {

        try {

            // ========================================
            // REQUIRE LOGIN
            // ========================================

            if (!req.session.userId) {

                return res.status(401).json({

                    error:
                        "You must be logged in."

                });

            }


            const userId =
                req.session.userId;


            // ========================================
            // BASIC STATISTICS
            // ========================================

            const statistics =
                db.prepare(`
                    SELECT
                        COUNT(*) AS totalTests,
                        COALESCE(
                            ROUND(AVG(percentage), 1),
                            0
                        ) AS averageScore,
                        COALESCE(
                            MAX(percentage),
                            0
                        ) AS highestScore,
                        COALESCE(
                            SUM(total_questions),
                            0
                        ) AS totalQuestions
                    FROM test_attempts
                    WHERE user_id = ?
                `).get(
                    userId
                );


            // ========================================
            // TOTAL CORRECT ANSWERS
            // ========================================

            const answerStatistics =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(is_correct),
                            0
                        ) AS correctAnswers,

                        COUNT(*) AS answeredQuestions

                    FROM attempt_questions aq

                    INNER JOIN test_attempts ta
                        ON ta.id = aq.attempt_id

                    WHERE ta.user_id = ?
                `).get(
                    userId
                );


            // ========================================
            // RECENT TESTS
            // ========================================

            const recentTests =
                db.prepare(`
                    SELECT
                        id,
                        course,
                        topic,
                        score,
                        total_questions,
                        percentage,
                        time_taken,
                        completed_at

                    FROM test_attempts

                    WHERE user_id = ?

                    ORDER BY completed_at DESC

                    LIMIT 5
                `).all(
                    userId
                );


            // ========================================
            // PERFORMANCE BY COURSE
            // ========================================

            const coursePerformance =
                db.prepare(`
                    SELECT
                        course,

                        COUNT(*) AS testsTaken,

                        ROUND(
                            AVG(percentage),
                            1
                        ) AS averageScore,

                        MAX(percentage)
                            AS highestScore

                    FROM test_attempts

                    WHERE user_id = ?

                    GROUP BY course

                    ORDER BY averageScore DESC
                `).all(
                    userId
                );


            // ========================================
            // RETURN DASHBOARD
            // ========================================

            return res.json({

                success:
                    true,

                statistics: {

                    ...statistics,

                    correctAnswers:
                        answerStatistics.correctAnswers,

                    answeredQuestions:
                        answerStatistics.answeredQuestions

                },

                recentTests,

                coursePerformance

            });

        }

        catch (error) {

            console.error(
                "Dashboard error:",
                error
            );


            return res.status(500).json({

                error:
                    "Could not load dashboard."

            });

        }

    }
);

// ============================================
// MULTER ERROR HANDLER
// ============================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        if (
            error instanceof
            multer.MulterError
        ) {

            return res.status(400).json({

                error:
                    error.message

            });

        }


        if (
            error &&
            error.message ===
                "Only JSON files are allowed."
        ) {

            return res.status(400).json({

                error:
                    error.message

            });

        }


        next(error);

    }
);


// ============================================
// START SERVER
// ============================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `CBT server running at http://localhost:${PORT}`
        );

    }
);