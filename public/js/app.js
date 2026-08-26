let catalog = {};


// ============================================
// ELEMENTS
// ============================================

const courseSelect =
    document.getElementById("course");

const topicSelect =
    document.getElementById("topic");

const questionCount =
    document.getElementById("question-count");

const testTime =
    document.getElementById("test-time");

const startButton =
    document.getElementById("start-test");


// ============================================
// CREATE CATEGORY SELECT
// ============================================

const categoryLabel =
    document.createElement("label");

categoryLabel.textContent =
    "Category";

categoryLabel.id =
    "category-label";

categoryLabel.style.display =
    "none";


const categorySelect =
    document.createElement("select");

categorySelect.id =
    "category";

categorySelect.disabled =
    true;

categorySelect.style.display =
    "none";


topicSelect.parentNode.insertBefore(
    categoryLabel,
    topicSelect
);

topicSelect.parentNode.insertBefore(
    categorySelect,
    topicSelect
);


// ============================================
// LOAD CATALOG
// ============================================

fetch("/api/catalog")

    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Could not load courses."
            );

        }

        return response.json();

    })

    .then(data => {

        catalog =
            data;

        loadCourses();

    })

    .catch(error => {

        console.error(
            error
        );

    });


// ============================================
// LOAD COURSES
// ============================================

function loadCourses() {

    courseSelect.innerHTML = `

        <option value="">
            Select a course
        </option>

    `;


    catalog.courses.forEach(
        course => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                course.id;


            option.textContent =
                course.name;


            courseSelect.appendChild(
                option
            );

        }
    );

}


// ============================================
// COURSE SELECTED
// ============================================

courseSelect.addEventListener(
    "change",
    () => {

        const course =
            catalog.courses.find(
                item =>
                    item.id ===
                    courseSelect.value
            );


        // Reset everything

        resetCategory();

        resetTopic();

        questionCount.textContent =
            "—";

        testTime.textContent =
            "—";

        startButton.disabled =
            true;


        if (!course) {

            return;

        }


        const categories =
            Array.isArray(
                course.categories
            )
                ? course.categories
                : [];


        // ====================================
        // COURSE HAS CATEGORIES
        // ====================================

        if (
            categories.length > 0
        ) {

            showCategorySelect(
                categories
            );

        }


        // ====================================
        // COURSE HAS DIRECT TOPICS
        // ====================================

        else {

            showDirectTopics(
                course
            );

        }

    }
);


// ============================================
// SHOW CATEGORY SELECT
// ============================================

function showCategorySelect(
    categories
) {

    categorySelect.innerHTML = `

        <option value="">
            Select a category
        </option>

    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category.id;


            option.textContent =
                category.name;


            categorySelect.appendChild(
                option
            );

        }
    );


    categoryLabel.style.display =
        "block";

    categorySelect.style.display =
        "block";

    categorySelect.disabled =
        false;


    topicSelect.innerHTML = `

        <option value="">
            Select a category first
        </option>

    `;

    topicSelect.disabled =
        true;

}


// ============================================
// SHOW DIRECT TOPICS
// ============================================

function showDirectTopics(
    course
) {

    categoryLabel.style.display =
        "none";

    categorySelect.style.display =
        "none";

    categorySelect.disabled =
        true;


    topicSelect.innerHTML = `

        <option value="">
            Select a topic
        </option>

    `;


    const topics =
        Array.isArray(
            course.topics
        )
            ? course.topics
            : [];


    topics.forEach(
        topic => {

            addTopicOption(
                topic
            );

        }
    );


    addGeneralOption();


    topicSelect.disabled =
        false;

}


// ============================================
// CATEGORY SELECTED
// ============================================

categorySelect.addEventListener(
    "change",
    () => {

        resetTopic();


        const course =
            catalog.courses.find(
                item =>
                    item.id ===
                    courseSelect.value
            );


        if (!course) {

            return;

        }


        const category =
            course.categories.find(
                item =>
                    item.id ===
                    categorySelect.value
            );


        if (!category) {

            return;

        }


        topicSelect.innerHTML = `

            <option value="">
                Select a topic
            </option>

        `;


        const topics =
            Array.isArray(
                category.topics
            )
                ? category.topics
                : [];


       topics.forEach(
    topic => {

        addTopicOption(
            topic,
            category.id
        );

    }
);


        topicSelect.disabled =
            false;

    }
);


// ============================================
// ADD TOPIC OPTION
// ============================================

function addTopicOption(
    topic,
    categoryId = null
) {

    const option =
        document.createElement(
            "option"
        );


    // ========================================
    // TOPIC VALUE
    // ========================================

    if (categoryId) {

        option.value =
            `${categoryId}/${topic.id}`;

    }

    else {

        option.value =
            topic.id;

    }


    // ========================================
    // TOPIC NAME
    // ========================================

    option.textContent =
        topic.name;


    topicSelect.appendChild(
        option
    );

}

// ============================================
// ADD GENERAL QUESTIONS
// ============================================

function addGeneralOption() {

    const generalOption =
        document.createElement(
            "option"
        );


    generalOption.value =
        "general";


    generalOption.textContent =
        "General Questions (60)";


    topicSelect.appendChild(
        generalOption
    );

}


// ============================================
// TOPIC SELECTED
// ============================================

topicSelect.addEventListener(
    "change",
    () => {

        const selectedTopic =
            topicSelect.value;


        questionCount.textContent =
            "—";

        testTime.textContent =
            "—";

        startButton.disabled =
            true;


        if (!selectedTopic) {

            return;

        }


        // ====================================
        // GENERAL QUESTIONS
        // ====================================

        if (
            selectedTopic ===
            "general"
        ) {

            questionCount.textContent =
                "60";

            testTime.textContent =
                "60 min";

            startButton.disabled =
                false;

            return;

        }


        // ====================================
        // FIND COURSE
        // ====================================

        const course =
            catalog.courses.find(
                item =>
                    item.id ===
                    courseSelect.value
            );


        if (!course) {

            return;

        }


        let topic = null;


        // ====================================
        // DIRECT TOPIC
        // ====================================

        if (
            Array.isArray(
                course.topics
            )
        ) {

            topic =
                course.topics.find(
                    item =>
                        item.id ===
                        selectedTopic
                );

        }


        // ====================================
        // CATEGORY TOPIC
        // ====================================

        if (
            !topic &&
            Array.isArray(
                course.categories
            )
        ) {

            for (
                const category
                of course.categories
            ) {

                if (
                    !Array.isArray(
                        category.topics
                    )
                ) {

                    continue;

                }


                 topic =
            category.topics.find(
                item =>
                    `${category.id}/${item.id}` ===
                    selectedTopic
            );



                if (topic) {

                    break;

                }

            }

        }


        if (!topic) {

            return;

        }


        // ====================================
        // DISPLAY QUESTION COUNT
        // ====================================

        const count =
            Number(
                topic.questionCount
            );


        if (
            !Number.isFinite(count) ||
            count <= 0
        ) {

            return;

        }


        questionCount.textContent =
            count;


        testTime.textContent =
            `${count} min`;


        startButton.disabled =
            false;

    }
);


/// ============================================
// START TEST
// ============================================

// ============================================
// START TEST
// ============================================

startButton.addEventListener(
    "click",
    () => {

        if (
            !courseSelect.value ||
            !topicSelect.value
        ) {

            return;

        }


        // ========================================
        // FIND SELECTED COURSE
        // ========================================

        const course =
            catalog.courses.find(
                item =>
                    item.id ===
                    courseSelect.value
            );


        if (!course) {

            console.error(
                "Could not find selected course:",
                courseSelect.value
            );

            return;

        }


        // ========================================
        // SAVE TEST INFORMATION
        // ========================================

        localStorage.setItem(
            "selectedCourse",
            course.name
        );


        localStorage.setItem(
            "selectedTopic",
            topicSelect.value
        );


        localStorage.setItem(
            "selectedCategory",
            categorySelect.value || ""
        );


        // ========================================
        // DEBUG
        // ========================================

        console.log(
            "Starting test with:",
            {
                course:
                    course.name,

                topic:
                    topicSelect.value,

                category:
                    categorySelect.value
            }
        );


        // ========================================
        // OPEN QUIZ
        // ========================================

        window.location.href =
            "quiz.html";

    }
);

// ============================================
// RESET CATEGORY
// ============================================

function resetCategory() {

    categorySelect.innerHTML = `

        <option value="">
            Select a category
        </option>

    `;


    categorySelect.value =
        "";


    categorySelect.disabled =
        true;


    categorySelect.style.display =
        "none";


    categoryLabel.style.display =
        "none";

}


// ============================================
// RESET TOPIC
// ============================================

function resetTopic() {

    topicSelect.innerHTML = `

        <option value="">
            Select a topic
        </option>

    `;


    topicSelect.value =
        "";


    topicSelect.disabled =
        true;

}