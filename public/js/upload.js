const courseSelect =
    document.getElementById("course");

const categorySelect =
    document.getElementById(
        "category"
    );

const categoryContainer =
    document.getElementById(
        "category-container"
    );

const topicSelect =
    document.getElementById("topic");

const uploadForm =
    document.getElementById("upload-form");

const message =
    document.getElementById("message");

    const createTopicButton =
    document.getElementById(
        "create-topic-button"
    );

const newTopicSection =
    document.getElementById(
        "new-topic-section"
    );

const newTopicName =
    document.getElementById(
        "new-topic-name"
    );

const newTopicQuestionCount =
    document.getElementById(
        "new-topic-question-count"
    );

let creatingNewTopic = false;

createTopicButton.addEventListener(
    "click",
    () => {

        creatingNewTopic =
            !creatingNewTopic;


        if (creatingNewTopic) {

            // -----------------------------
            // ENTER NEW TOPIC MODE
            // -----------------------------

            newTopicSection.style.display =
                "block";


            topicSelect.disabled =
                true;


            topicSelect.value =
                "";


            resetQuestionBank();


            createTopicButton.textContent =
                "← Use Existing Topic";

        }

        else {

            // -----------------------------
            // RETURN TO EXISTING TOPIC
            // -----------------------------

            newTopicSection.style.display =
                "none";


            topicSelect.disabled =
                false;


            newTopicName.value =
                "";


            createTopicButton.textContent =
                "+ Create New Topic";

        }

    }
);

// ============================================
// QUESTION BANK CONTAINER
// ============================================

const questionBankContainer =
    document.createElement("div");

questionBankContainer.style.display =
    "none";


questionBankContainer.innerHTML = `

    <br>

    <label for="questionBank">
        Question Bank
    </label>

    <select
        id="questionBank"
        name="questionFile"
    >

        <option value="">
            Select Question Bank
        </option>

    </select>

`;


topicSelect
    .parentNode
    .insertBefore(
        questionBankContainer,
        document.querySelector(
            'input[type="file"]'
        )
    );


const questionBankSelect =
    document.getElementById(
        "questionBank"
    );


// ============================================
// STORE CATALOG
// ============================================

let catalog = null;


// ============================================
// LOAD CATALOG
// ============================================

loadCatalog();


async function loadCatalog() {

    try {

        const response =
            await fetch(
                "/api/catalog"
            );


        if (!response.ok) {

            throw new Error(
                "Could not load catalog."
            );

        }


        catalog =
            await response.json();


        populateCourses();

    }

    catch (error) {

        console.error(error);

        message.textContent =
            "Could not load courses.";

    }

}


// ============================================
// POPULATE COURSES
// ============================================

function populateCourses() {

    courseSelect.innerHTML = `

        <option value="">
            Select Course
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
// COURSE CHANGED
// ============================================

courseSelect.addEventListener(
    "change",
    () => {

        resetTopic();

        categorySelect.innerHTML = `
            <option value="">
                Select System / Category
            </option>
        `;

        categorySelect.disabled =
            true;

        categoryContainer.style.display =
            "none";


        const course =
            catalog.courses.find(
                item =>
                    item.id ===
                    courseSelect.value
            );

        if (!course) {
            return;
        }


        const categories =
    course.categories || [];

        


        // ====================================
        // COURSE HAS CATEGORIES
        // ====================================

        if (
            categories.length > 0
        ) {

            categoryContainer.style.display =
                "block";

            categorySelect.disabled =
                false;


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

            return;

        }


        // ====================================
        // NO CATEGORY
        // ====================================

        populateTopics(
            course.topics
        );

    }
);

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
            item.id === categorySelect.value
    );

        if (!category) {
            return;
        }


        populateTopics(
            category.topics
        );

    }
);

function populateTopics(
    topics
) {

    topicSelect.innerHTML = `
        <option value="">
            Select Topic
        </option>
    `;


    topics
        .filter(
            topic =>
                topic.type === "file" ||
                topic.type === "folder"
        )
        .forEach(
            topic => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    topic.id;

                option.textContent =
                    topic.name;

                topicSelect.appendChild(
                    option
                );

            }
        );


    topicSelect.disabled =
        false;

}

// ============================================
// TOPIC CHANGED
// ============================================

topicSelect.addEventListener(
    "change",
    () => {

        resetQuestionBank();


        const course =
            catalog.courses.find(
                item =>
                    item.id ===
                    courseSelect.value
            );


        if (!course) {
            return;
        }


        // ====================================
        // FIND SELECTED CATEGORY
        // ====================================

        const category =
            course.categories.find(
                item =>
                    item.id ===
                    categorySelect.value
            );


        if (!category) {
            return;
        }


        // ====================================
        // FIND SELECTED TOPIC
        // ====================================

        const topic =
            category.topics.find(
                item =>
                    item.id ===
                    topicSelect.value
            );


        if (!topic) {
            return;
        }


        // ====================================
        // FOLDER TOPIC
        // ====================================

        if (
            topic.type === "folder"
        ) {

            questionBankContainer
                .style
                .display = "block";


            questionBankSelect
                .innerHTML = `

                    <option value="">
                        Select Question Bank
                    </option>

                `;


            topic.questionBanks
                .forEach(
                    bank => {

                        const option =
                            document
                                .createElement(
                                    "option"
                                );


                        option.value =
                            bank.file;


                        option.textContent =
                            `${bank.name} (${bank.questionCount} questions)`;


                        questionBankSelect
                            .appendChild(
                                option
                            );

                    }
                );

        }

    }
);

// ============================================
// RESET TOPIC
// ============================================

function resetTopic() {

    topicSelect.innerHTML = `

        <option value="">
            Select Topic
        </option>

    `;


    topicSelect.disabled =
        true;


    resetQuestionBank();

}


// ============================================
// RESET QUESTION BANK
// ============================================

function resetQuestionBank() {

    questionBankContainer
        .style
        .display = "none";


    questionBankSelect.innerHTML = `

        <option value="">
            Select Question Bank
        </option>

    `;

}


// ============================================
// UPLOAD
// ============================================

uploadForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        message.textContent =
            "";


        const course =
            courseSelect.value;

        const topic =
            topicSelect.value;

        const file =
            document.getElementById(
                "questionFile"
            ).files[0];


        // ====================================
        // BASIC VALIDATION
        // ====================================

        if (
            !course ||
            !file
        ) {

            message.textContent =
                "Please select a course and JSON file.";

            return;

        }

        if (
    !creatingNewTopic &&
    !topic
) {

    message.textContent =
        "Please select a topic.";

    return;

}


if (
    creatingNewTopic &&
    !newTopicName.value.trim()
) {

    message.textContent =
        "Please enter a name for the new topic.";

    newTopicName.focus();

    return;

}

        // ====================================
        // QUESTION BANK REQUIRED FOR FOLDER
        // ====================================

        if (
            questionBankContainer
                .style
                .display === "block" &&
            !questionBankSelect.value
        ) {

            message.textContent =
                "Please select a question bank.";

            return;

        }


        // ====================================
        // FORM DATA
        // ====================================

        const formData =
            new FormData();


        formData.append(
            "course",
            course
        );

        formData.append(
    "category",
    categorySelect.value || ""
);

        formData.append(
         "creatingNewTopic",
          creatingNewTopic
        );

       if (creatingNewTopic) {

    formData.append(
        "newTopicName",
        newTopicName.value.trim()
    );

    formData.append(
        "newTopicQuestionCount",
        newTopicQuestionCount.value
    );

}
else {

    formData.append(
        "topic",
        topicSelect.value
    );

}


        formData.append(
            "questionFile",
            file
        );

       

        // ------------------------------------
        // QUESTION BANK
        // ------------------------------------

        if (
            questionBankSelect.value
        ) {

            formData.append(
                "targetFile",
                questionBankSelect.value
            );

        }


        // ====================================
        // UPLOAD
        // ====================================

        message.textContent =
            "Uploading...";


        try {

            const response =
                await fetch(
                    "/api/upload-questions",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    result.error ||
                    "Upload failed.";

                console.error(
                    result
                );

                return;

            }


            // =================================
            // SUCCESS
            // =================================

            message.textContent =
                result.message;


            uploadForm.reset();


            resetTopic();

        }

        catch (error) {

            console.error(error);

            message.textContent =
                "An error occurred during upload.";

        }

    }
);