// ============================================
// CBT ENGINE
// ============================================

let questions = [];

let currentQuestion = 0;

let userAnswers = [];

let flaggedQuestions = [];


// ============================================
// GET TEST INFORMATION
// ============================================

const selectedCourse =
    localStorage.getItem("selectedCourse");

const selectedTopic =
    localStorage.getItem("selectedTopic");


// ============================================
// ELEMENTS
// ============================================

const courseName =
    document.getElementById("course-name");

const topicName =
    document.getElementById("topic-name");

const questionNumber =
    document.getElementById("question-number");

const questionText =
    document.getElementById("question-text");

const optionsContainer =
    document.getElementById("options-container");

const previousButton =
    document.getElementById("previous-button");

const nextButton =
    document.getElementById("next-button");

const flagButton =
    document.getElementById("flag-button");

const submitButton =
    document.getElementById("submit-button");

const navigator =
    document.getElementById("question-navigator");

const progress =
    document.getElementById("progress");

const timerElement =
    document.getElementById("timer");


// ============================================
// TIMER
// ============================================

let timeRemaining = 0;

let timerInterval;
let testStartTime = null;


// ============================================
// INITIALIZE
// ============================================

initialize();


async function initialize() {

    if (
        !selectedCourse ||
        !selectedTopic
    ) {

        window.location.href =
            "index.html";

        return;

    }


    courseName.textContent =
        formatText(selectedCourse);


    topicName.textContent =
        selectedTopic === "general"
            ? "General Questions"
            : formatText(selectedTopic);


    await loadQuestions();

}


// ============================================
// LOAD QUESTIONS
// ============================================

async function loadQuestions() {

    try {

        const response =
            await fetch(
                `/api/questions?course=${encodeURIComponent(
                    selectedCourse
                )}&topic=${encodeURIComponent(
                    selectedTopic
                )}`
            );


        if (!response.ok) {

            throw new Error(
                "Could not load questions."
            );

        }


        const data =
            await response.json();


        questions =
            data.questions;


        if (questions.length === 0) {

            showNoQuestions();

            return;

        }


        // Create answer storage

        userAnswers =
            new Array(
                questions.length
            ).fill(null);


        // Create flag storage

        flaggedQuestions =
            new Array(
                questions.length
            ).fill(false);


        // Determine timer

        /*
            One minute per question.
        */

        timeRemaining =
            questions.length * 60;

            
        testStartTime = Date.now();
        startTimer();


        buildQuestionNavigator();


        displayQuestion();

    }

    catch (error) {

        console.error(error);

        questionText.textContent =
            "Unable to load the questions.";

    }

}


// ============================================
// DISPLAY QUESTION
// ============================================

function displayQuestion() {

    const question =
        questions[currentQuestion];


    questionNumber.textContent =
        `Question ${currentQuestion + 1} of ${questions.length}`;


    questionText.textContent =
        question.question;


    optionsContainer.innerHTML = "";


    const optionLetters =
        ["A", "B", "C", "D"];


    optionLetters.forEach(
        (letter) => {

            const option =
                document.createElement("div");


            option.className =
                "option";


            if (
                userAnswers[currentQuestion]
                === letter
            ) {

                option.classList.add(
                    "selected"
                );

            }


            option.innerHTML = `

                <span class="option-letter">
                    ${letter}
                </span>

                <span>
                    ${question.options[letter]}
                </span>

            `;


            option.addEventListener(
                "click",
                () => {

                    selectAnswer(letter);

                }
            );


            optionsContainer.appendChild(
                option
            );

        }
    );


    updateNavigation();

    updateQuestionNavigator();

    updateFlagButton();

    updateProgress();

}


// ============================================
// SELECT ANSWER
// ============================================

function selectAnswer(answerLetter) {

    userAnswers[currentQuestion] =
        answerLetter;


    displayQuestion();

}


// ============================================
// NEXT QUESTION
// ============================================

nextButton.addEventListener(
    "click",
    () => {

        if (
            currentQuestion <
            questions.length - 1
        ) {

            currentQuestion++;

            displayQuestion();

        }

    }
);


// ============================================
// PREVIOUS QUESTION
// ============================================

previousButton.addEventListener(
    "click",
    () => {

        if (
            currentQuestion > 0
        ) {

            currentQuestion--;

            displayQuestion();

        }

    }
);


// ============================================
// FLAG QUESTION
// ============================================

flagButton.addEventListener(
    "click",
    () => {

        flaggedQuestions[currentQuestion] =
            !flaggedQuestions[currentQuestion];


        updateFlagButton();

        updateQuestionNavigator();

    }
);


// ============================================
// FLAG BUTTON
// ============================================

function updateFlagButton() {

    if (
        flaggedQuestions[currentQuestion]
    ) {

        flagButton.classList.add(
            "flagged"
        );

        flagButton.textContent =
            "⚑ Flagged";

    }

    else {

        flagButton.classList.remove(
            "flagged"
        );

        flagButton.textContent =
            "⚑ Flag";

    }

}

// ============================================
// SUBMIT BUTTON
// ============================================

submitButton.addEventListener(
    "click",
    () => {

        const unanswered =
            userAnswers.filter(
                answer => answer === null
            ).length;

        if (unanswered > 0) {

            const confirmSubmit =
                confirm(
                    `You have ${unanswered} unanswered question(s). Submit anyway?`
                );

            if (!confirmSubmit) {
                return;
            }

        }

        submitTest();

    }
);

// ============================================
// QUESTION NAVIGATOR
// ============================================

function buildQuestionNavigator() {

    navigator.innerHTML = "";


    questions.forEach(
        (_, index) => {

            const button =
                document.createElement("button");


            button.className =
                "question-number-button";


            button.textContent =
                index + 1;


            button.addEventListener(
                "click",
                () => {

                    currentQuestion =
                        index;

                    displayQuestion();

                }
            );


            navigator.appendChild(
                button
            );

        }
    );

}


// ============================================
// UPDATE QUESTION NAVIGATOR
// ============================================

function updateQuestionNavigator() {

    const buttons =
        navigator.querySelectorAll(
            ".question-number-button"
        );


    buttons.forEach(
        (button, index) => {

            button.classList.remove(
                "current",
                "answered",
                "flagged"
            );


            if (
                index === currentQuestion
            ) {

                button.classList.add(
                    "current"
                );

            }


            if (
                userAnswers[index] !== null
            ) {

                button.classList.add(
                    "answered"
                );

            }


            if (
                flaggedQuestions[index]
            ) {

                button.classList.add(
                    "flagged"
                );

            }

        }
    );

}


// ============================================
// UPDATE NAVIGATION BUTTONS
// ============================================

function updateNavigation() {

    previousButton.disabled =
        currentQuestion === 0;


    nextButton.disabled =
        currentQuestion ===
        questions.length - 1;

}


// ============================================
// UPDATE PROGRESS
// ============================================

function updateProgress() {

    const answered =
        userAnswers.filter(
            answer => answer !== null
        ).length;


    progress.textContent =
        `${answered} / ${questions.length}`;

}


// ============================================
// TIMER
// ============================================

function startTimer() {

    updateTimerDisplay();


    timerInterval =
        setInterval(
            () => {

                timeRemaining--;


                updateTimerDisplay();


                if (
                    timeRemaining <= 0
                ) {

                    clearInterval(
                        timerInterval
                    );


                    submitTest();

                }

            },
            1000
        );

}


// ============================================
// TIMER DISPLAY
// ============================================

function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timeRemaining / 60
        );


    const seconds =
        timeRemaining % 60;


    timerElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(
            seconds
        ).padStart(2, "0")}`;

}


// ============================================
// SUBMIT TEST STATE
// ============================================

let testSubmitted = false;


// ============================================
// RESET SUBMISSION STATE WHEN PAGE IS RESTORED
// ============================================

window.addEventListener(
    "pageshow",
    () => {

        testSubmitted = false;

    }
);


async function submitTest() {

    // Prevent double submission
    if (testSubmitted) {
        return;
    }

    testSubmitted = true;

    clearInterval(timerInterval);


    // ========================================
    // CALCULATE SCORE
    // ========================================

    let score = 0;

    const questionResults =
        questions.map(
            (question, index) => {

                const selectedAnswer =
                    userAnswers[index];

                const correctAnswer =
                    question.answer;

                const isCorrect =
                    selectedAnswer !== null &&
                    selectedAnswer === correctAnswer;


                if (isCorrect) {
                    score++;
                }


                return {

                    questionId:
                        question.id || null,

                    selectedAnswer:
                        selectedAnswer,

                    correctAnswer:
                        correctAnswer,

                    isCorrect:
                        isCorrect ? 1 : 0

                };

            }
        );


    // ========================================
    // TEST INFORMATION
    // ========================================

    const totalQuestions =
        questions.length;


    const percentage =
        totalQuestions > 0
            ? (score / totalQuestions) * 100
            : 0;


    // ========================================
    // CALCULATE TIME TAKEN
    // ========================================

   const timeTaken =
    testStartTime
        ? Math.floor(
            (Date.now() - testStartTime) / 1000
        )
        : 0;


    // ========================================
    // SAVE ATTEMPT TO DATABASE
    // ========================================

    // ========================================
    // CHECK LOGIN STATUS
    // ========================================

    let authenticated = false;

    try {

        const authResponse =
            await fetch(
                "/api/auth/me"
            );


        if (authResponse.ok) {

            const authData =
                await authResponse.json();

            authenticated =
                authData.authenticated === true;

        }

    }

    catch (error) {

        console.warn(
            "Could not check login status:",
            error
        );

    }


    // ========================================
    // SAVE RESULT LOCALLY
    // ========================================

    if (!authenticated) {

    sessionStorage.setItem(
        "cbtResult",
        JSON.stringify({

            attemptId: null,

            course:
                selectedCourse,

            topic:
                selectedTopic,

            score:
                score,

            totalQuestions:
                totalQuestions,

            percentage:
                percentage,

            timeTaken:
                timeTaken,

            questions:
                questions,

            userAnswers:
                userAnswers,

            flaggedQuestions:
                flaggedQuestions

        })
    );

    window.location.href =
        "results.html";

    return;

}

    // ========================================
    // LOGGED-IN USER
    // ========================================

    try {

        if (authenticated) {

            try {

            const response =
                await fetch(
                    "/api/attempts",
                    {

                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                course:
                                    selectedCourse,

                                topic:
                                    selectedTopic,

                                score:
                                    score,

                                totalQuestions:
                                    totalQuestions,

                                percentage:
                                    percentage,

                                timeTaken:
                                    timeTaken,

                                questions:
                                    questionResults

                            })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Could not save test attempt."
                );

            }


            // Update saved result
            sessionStorage.setItem(
                "cbtResult",
                JSON.stringify({

                    course:
                        selectedCourse,

                    topic:
                        selectedTopic,

                    score:
                        score,

                    totalQuestions:
                        totalQuestions,

                    percentage:
                        percentage,

                    timeTaken:
                        timeTaken,

                    questions:
                        questions,

                    userAnswers:
                        userAnswers,

                    flaggedQuestions:
                        flaggedQuestions,

                    attemptId:
                        data.attempt.id,

                    saved:
                        true

                })
            );

        }

        catch (error) {

            console.error(
                "Error saving test attempt:",
                error
            );

            // Don't prevent the user from
            // seeing their result.
            console.warn(
                "Result will be available locally."
            );

        }

    }


    // ========================================
    // GO TO RESULTS
    // ========================================

    window.location.href =
        "results.html";

}

    catch (error) {

        console.error(
            "Error saving test attempt:",
            error
        );


        // Allow the user to try again
        testSubmitted = false;


        alert(
            error.message ||
            "Your test could not be saved. Please try again."
        );

    }

}



// ============================================
// NO QUESTIONS
// ============================================

function showNoQuestions() {

    questionNumber.textContent =
        "No questions available";


    questionText.textContent =
        "There are currently no questions available for this test.";


    optionsContainer.innerHTML =
        "";


    previousButton.disabled =
        true;


    nextButton.disabled =
        true;


    flagButton.disabled =
        true;


    submitButton.disabled =
        true;


    progress.textContent =
        "0 / 0";

}


// ============================================
// FORMAT TEXT
// ============================================

function formatText(text) {

    if (!text) return "";


    return text
        .replaceAll("-", " ")
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}