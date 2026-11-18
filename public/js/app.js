
let catalog = {};
let curriculum = {};
let selectedCurriculumCourse = null;
let selectedBankCourse = null;
let availableQuestions = 0;

const levelSelect = document.getElementById("level");
const semesterSelect = document.getElementById("semester");
const courseSelect = document.getElementById("course");
const topicSelect = document.getElementById("topic");
const categorySelect = document.getElementById("category");
const categoryLabel = document.getElementById("category-label");

const questionCountSelect = document.getElementById("question-count");
const availableQuestionCount = document.getElementById("available-question-count");
const testTime = document.getElementById("test-time");

const startButton = document.getElementById("start-test");
const courseStatus = document.getElementById("course-status");


// ============================================
// INITIALISE PRACTICE PAGE
// ============================================

async function initialisePracticePage() {
    try {
        const [catalogResponse, curriculumResponse] = await Promise.all([
            fetch("/api/catalog"),
            fetch("/api/curriculum")
        ]);

        if (!catalogResponse.ok) {
            throw new Error("Could not load the question-bank catalogue.");
        }

        if (!curriculumResponse.ok) {
            throw new Error("Could not load the nursing curriculum.");
        }

        catalog = await catalogResponse.json();
        curriculum = await curriculumResponse.json();

        loadLevels();

    } catch (error) {
        console.error("Practice page loading error:", error);

        courseStatus.textContent =
            "Unable to load the course catalogue. Please refresh the page.";
    }
}


// ============================================
// LEVELS
// ============================================

function loadLevels() {
    levelSelect.innerHTML =
        '<option value="">Select your level</option>';

    curriculum.levels.forEach(level => {
        const option = document.createElement("option");

        option.value = level.id;
        option.textContent = level.name;

        levelSelect.appendChild(option);
    });

    levelSelect.disabled = false;
}


// ============================================
// SEMESTERS
// ============================================

function loadSemesters(levelId) {
    resetSemester();
    resetCourse();
    resetCategory();
    resetTopic();
    resetQuestionCount();

    const level = curriculum.levels.find(
        item => item.id === levelId
    );

    if (!level) return;

    semesterSelect.innerHTML =
        '<option value="">Select a semester</option>';

    level.semesters.forEach(semester => {
        const option = document.createElement("option");

        option.value = semester.id;
        option.textContent = semester.name;

        semesterSelect.appendChild(option);
    });

    semesterSelect.disabled = false;

    // Pre-500 clinical practice has one concentrated placement period.
    if (level.id === "pre500") {
        semesterSelect.value = "clinical";
        semesterSelect.disabled = true;

        loadCourses();
    }
}


// ============================================
// COURSES
// ============================================

function loadCourses() {
    resetCourse();
    resetCategory();
    resetTopic();
    resetQuestionCount();

    const levelId = levelSelect.value;
    const semesterId = semesterSelect.value;

    if (!levelId || !semesterId) return;

    const level = curriculum.levels.find(
        item => item.id === levelId
    );

    if (!level) return;

    const semester = level.semesters.find(
        item => item.id === semesterId
    );

    if (!semester) return;

    courseSelect.innerHTML =
        '<option value="">Select a course</option>';

    semester.courses.forEach(course => {
        const bankCourse = findBankCourse(course);

        const option = document.createElement("option");

        option.value = course.id;

        option.textContent = bankCourse
            ? `${course.code} — ${course.title}`
            : `${course.code} — ${course.title} (Coming soon)`;

        courseSelect.appendChild(option);
    });

    courseSelect.disabled = false;
}


function findBankCourse(curriculumCourse) {
    if (!curriculumCourse.bankFolder) return null;

    return catalog.courses.find(
        course => course.name === curriculumCourse.bankFolder
    ) || null;
}


// ============================================
// SELECT COURSE
// ============================================

function selectCourse(courseId) {
    resetCategory();
    resetTopic();
    resetQuestionCount();

    selectedCurriculumCourse = null;
    selectedBankCourse = null;

    courseStatus.textContent = "";

    const level = curriculum.levels.find(
        item => item.id === levelSelect.value
    );

    if (!level) return;

    const semester = level.semesters.find(
        item => item.id === semesterSelect.value
    );

    if (!semester) return;

    selectedCurriculumCourse = semester.courses.find(
        course => course.id === courseId
    );

    if (!selectedCurriculumCourse) return;

    selectedBankCourse = findBankCourse(selectedCurriculumCourse);

    if (!selectedBankCourse) {
        courseStatus.textContent =
            "Coming soon — the question bank for this course is not available yet.";

        return;
    }

    const hasCategories =
        Array.isArray(selectedBankCourse.categories) &&
        selectedBankCourse.categories.length > 0;

    const hasTopics =
        Array.isArray(selectedBankCourse.topics) &&
        selectedBankCourse.topics.length > 0;

    if (!hasCategories && !hasTopics) {
        courseStatus.textContent =
            "Coming soon — no question topics have been added to this course yet.";

        selectedBankCourse = null;
        return;
    }

    courseStatus.textContent = "Question bank available.";

    if (hasCategories) {
        showCategorySelect(selectedBankCourse.categories);
    } else {
        showDirectTopics(selectedBankCourse);
    }
}


// ============================================
// CATEGORIES
// ============================================

function showCategorySelect(categories) {
    resetCategory();
    resetTopic();
    resetQuestionCount();

    categorySelect.innerHTML =
        '<option value="">Select a category</option>';

    categories.forEach(category => {
        const option = document.createElement("option");

        option.value = category.id;
        option.textContent = category.name;

        categorySelect.appendChild(option);
    });

    categoryLabel.hidden = false;
    categorySelect.hidden = false;
    categorySelect.disabled = false;
}


function showDirectTopics(course) {
    resetCategory();
    resetTopic();
    resetQuestionCount();

    topicSelect.innerHTML =
        '<option value="">Select a topic</option>';

    course.topics.forEach(topic => {
        addTopicOption(topic);
    });

    addGeneralOption();

    topicSelect.disabled = false;
}


function loadCategoryTopics(categoryId) {
    resetTopic();
    resetQuestionCount();

    if (!selectedBankCourse) return;

    const category = selectedBankCourse.categories.find(
        item => item.id === categoryId
    );

    if (!category || !Array.isArray(category.topics)) return;

    topicSelect.innerHTML =
        '<option value="">Select a topic</option>';

    category.topics.forEach(topic => {
        addTopicOption(topic, categoryId);
    });

    topicSelect.disabled = false;
}


// ============================================
// TOPIC OPTIONS
// ============================================

function addTopicOption(topic, categoryId = null) {
    const option = document.createElement("option");

    option.value = categoryId
        ? `${categoryId}/${topic.id}`
        : topic.id;

    option.textContent = topic.name;

    topicSelect.appendChild(option);
}


function addGeneralOption() {
    const option = document.createElement("option");

    option.value = "general";
    option.textContent = "General Questions";

    topicSelect.appendChild(option);
}


// ============================================
// TOPIC CHANGE AND AVAILABLE QUESTION COUNT
// ============================================

async function handleTopicChange() {
    resetQuestionCount();

    const selectedTopic = topicSelect.value;

    if (!selectedTopic || !selectedBankCourse) return;

    questionCountSelect.disabled = true;
    questionCountSelect.innerHTML =
        '<option value="">Checking available questions...</option>';

    try {
        const response = await fetch(
            `/api/questions?course=${encodeURIComponent(
                selectedBankCourse.name
            )}&topic=${encodeURIComponent(
                selectedTopic
            )}&info=1`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Could not check available questions."
            );
        }

        availableQuestions = Number(data.totalAvailable) || 0;

        availableQuestionCount.textContent = availableQuestions;

        if (availableQuestions < 10) {
            questionCountSelect.innerHTML =
                '<option value="">Not enough questions available</option>';

            courseStatus.textContent =
                "This topic needs at least 10 valid questions to create a test.";

            return;
        }

        questionCountSelect.innerHTML =
            '<option value="">Choose question count</option>';

        for (
            let count = 10;
            count <= availableQuestions;
            count += 10
        ) {
            const option = document.createElement("option");

            option.value = count;
            option.textContent = `${count} Questions`;

            questionCountSelect.appendChild(option);
        }

        questionCountSelect.disabled = false;

        courseStatus.textContent =
            "Choose how many questions you want in this test.";

    } catch (error) {
        console.error("Question availability error:", error);

        questionCountSelect.innerHTML =
            '<option value="">Unable to check questions</option>';

        courseStatus.textContent =
            error.message || "Unable to check available questions.";
    }
}


// ============================================
// QUESTION COUNT AND TIME
// ============================================

function handleQuestionCountChange() {
    const count = Number(questionCountSelect.value);

    startButton.disabled = true;
    testTime.textContent = "—";

    if (
        !Number.isInteger(count) ||
        count < 10 ||
        count % 10 !== 0 ||
        count > availableQuestions
    ) {
        return;
    }

    const minutes = count / 2;

    testTime.textContent =
        `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;

    startButton.disabled = false;
}


// ============================================
// RESET FUNCTIONS
// ============================================

function resetSemester() {
    semesterSelect.innerHTML =
        '<option value="">Select a level first</option>';

    semesterSelect.disabled = true;
}


function resetCourse() {
    courseSelect.innerHTML =
        '<option value="">Select a semester first</option>';

    courseSelect.disabled = true;

    selectedCurriculumCourse = null;
    selectedBankCourse = null;

    courseStatus.textContent = "";
}


function resetCategory() {
    categorySelect.innerHTML =
        '<option value="">Select a category</option>';

    categorySelect.disabled = true;
    categorySelect.hidden = true;
    categoryLabel.hidden = true;
}


function resetTopic() {
    topicSelect.innerHTML =
        '<option value="">Select a course first</option>';

    topicSelect.disabled = true;
}


function resetQuestionCount() {
    availableQuestions = 0;

    availableQuestionCount.textContent = "—";
    testTime.textContent = "—";

    questionCountSelect.innerHTML =
        '<option value="">Select a topic first</option>';

    questionCountSelect.disabled = true;

    startButton.disabled = true;
}


// ============================================
// EVENT LISTENERS
// ============================================

levelSelect.addEventListener("change", () => {
    resetSemester();
    resetCourse();
    resetCategory();
    resetTopic();
    resetQuestionCount();

    if (levelSelect.value) {
        loadSemesters(levelSelect.value);
    }
});


semesterSelect.addEventListener("change", () => {
    resetCourse();
    resetCategory();
    resetTopic();
    resetQuestionCount();

    if (semesterSelect.value) {
        loadCourses();
    }
});


courseSelect.addEventListener("change", () => {
    if (courseSelect.value) {
        selectCourse(courseSelect.value);
    } else {
        resetCategory();
        resetTopic();
        resetQuestionCount();

        courseStatus.textContent = "";
    }
});


categorySelect.addEventListener("change", () => {
    if (categorySelect.value) {
        loadCategoryTopics(categorySelect.value);
    } else {
        resetTopic();
        resetQuestionCount();
    }
});


topicSelect.addEventListener("change", handleTopicChange);

questionCountSelect.addEventListener(
    "change",
    handleQuestionCountChange
);


// ============================================
// START TEST
// ============================================

startButton.addEventListener("click", () => {
    const chosenCount = Number(questionCountSelect.value);

    if (
        !selectedCurriculumCourse ||
        !selectedBankCourse ||
        !topicSelect.value ||
        !Number.isInteger(chosenCount) ||
        chosenCount < 10 ||
        chosenCount % 10 !== 0 ||
        chosenCount > availableQuestions
    ) {
        return;
    }

    // Existing values expected by quiz.js.
    localStorage.setItem("selectedCourse", selectedBankCourse.name);
    localStorage.setItem("selectedTopic", topicSelect.value);
    localStorage.setItem("selectedCategory", categorySelect.value || "");

    // Student's selected test length.
    localStorage.setItem(
        "selectedQuestionCount",
        String(chosenCount)
    );

    // Curriculum information.
    localStorage.setItem(
        "selectedLevel",
        levelSelect.options[levelSelect.selectedIndex].textContent
    );

    localStorage.setItem(
        "selectedSemester",
        semesterSelect.options[semesterSelect.selectedIndex].textContent
    );

    localStorage.setItem(
        "selectedCourseCode",
        selectedCurriculumCourse.code
    );

    localStorage.setItem(
        "selectedCourseTitle",
        selectedCurriculumCourse.title
    );

    console.log("Starting CBT:", {
        level: levelSelect.value,
        semester: semesterSelect.value,
        curriculumCourse: selectedCurriculumCourse,
        bankCourse: selectedBankCourse.name,
        topic: topicSelect.value,
        category: categorySelect.value,
        availableQuestions,
        selectedQuestionCount: chosenCount,
        timeInMinutes: chosenCount / 2
    });

    window.location.href = "quiz.html";
});


// ============================================
// START
// ============================================

initialisePracticePage();
