// ============================================
// CBT RESULTS
// ============================================


// ============================================
// GET RESULT
// ============================================

const storedResult =
    sessionStorage.getItem("cbtResult");


if (!storedResult) {

    window.location.href =
        "index.html";

}


// ============================================
// PARSE RESULT
// ============================================

let result;


try {

    result =
        JSON.parse(
            storedResult
        );

}

catch (error) {

    console.error(
        "Could not read test result:",
        error
    );

    window.location.href =
        "index.html";

}


// ============================================
// ELEMENTS
// ============================================

const resultTopic =
    document.getElementById(
        "result-topic"
    );

const resultCourse =
    document.getElementById(
        "result-course"
    );

const scorePercentage =
    document.getElementById(
        "score-percentage"
    );

const score =
    document.getElementById(
        "score"
    );

const correctCount =
    document.getElementById(
        "correct-count"
    );

const incorrectCount =
    document.getElementById(
        "incorrect-count"
    );

const unansweredCount =
    document.getElementById(
        "unanswered-count"
    );

const timeUsed =
    document.getElementById(
        "time-used"
    );

const reviewContainer =
    document.getElementById(
        "review-container"
    );

const reviewButton =
    document.getElementById(
        "review-button"
    );

const homeButton =
    document.getElementById(
        "home-button"
    );


// ============================================
// INITIALIZE
// ============================================

initializeResults();


function initializeResults() {

    if (
        !result ||
        !Array.isArray(
            result.questions
        ) ||
        !Array.isArray(
            result.userAnswers
        )
    ) {

        window.location.href =
            "index.html";

        return;

    }


    displayTestInformation();

    calculateResult();

    buildQuestionReview();

}


// ============================================
// TEST INFORMATION
// ============================================

function displayTestInformation() {

    resultTopic.textContent =
        result.topic === "general"
            ? "General Questions"
            : formatText(
                result.topic
            );


    resultCourse.textContent =
        formatText(
            result.course
        );

}


// ============================================
// CALCULATE RESULT
// ============================================

function calculateResult() {

    const questions =
        result.questions;

    const answers =
        result.userAnswers;


    let correct = 0;

    let incorrect = 0;

    let unanswered = 0;


    questions.forEach(
        (
            question,
            index
        ) => {

            const userAnswer =
                answers[index];


            if (
                userAnswer === null ||
                userAnswer === undefined
            ) {

                unanswered++;

            }

            else if (
                userAnswer ===
                question.answer
            ) {

                correct++;

            }

            else {

                incorrect++;

            }

        }
    );


    const total =
        questions.length;


    const percentage =
        total > 0
            ? Math.round(
                (correct / total) * 100
            )
            : 0;


    // ========================================
    // DISPLAY
    // ========================================

    score.textContent =
        `${correct} / ${total}`;


    scorePercentage.textContent =
        `${percentage}%`;


    correctCount.textContent =
        correct;


    incorrectCount.textContent =
        incorrect;


    unansweredCount.textContent =
        unanswered;


    // ========================================
    // TIME
    // ========================================

    const totalTime =
        questions.length * 60;


    const timeRemaining =
        Number(
            result.timeRemaining
        ) || 0;


    const timeTaken =
        Math.max(
            0,
            totalTime -
            timeRemaining
        );


    timeUsed.textContent =
        formatTime(
            timeTaken
        );

}


// ============================================
// BUILD QUESTION REVIEW
// ============================================

function buildQuestionReview() {

    reviewContainer.innerHTML =
        "";


    result.questions.forEach(
        (
            question,
            index
        ) => {

            const userAnswer =
                result.userAnswers[
                    index
                ];


            const isUnanswered =
                userAnswer === null ||
                userAnswer === undefined;


            const isCorrect =
                !isUnanswered &&
                userAnswer ===
                question.answer;


            // ==================================
            // CARD
            // ==================================

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "review-card";


            if (isCorrect) {

                card.classList.add(
                    "review-correct"
                );

            }

            else if (isUnanswered) {

                card.classList.add(
                    "review-unanswered"
                );

            }

            else {

                card.classList.add(
                    "review-incorrect"
                );

            }


            // ==================================
            // HEADER
            // ==================================

            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "review-card-header";


            const number =
                document.createElement(
                    "strong"
                );


            number.textContent =
                `Question ${index + 1}`;


            const status =
                document.createElement(
                    "span"
                );


            if (isCorrect) {

                status.textContent =
                    "✓ Correct";

            }

            else if (isUnanswered) {

                status.textContent =
                    "— Unanswered";

            }

            else {

                status.textContent =
                    "✗ Incorrect";

            }


            status.className =
                "review-status";


            header.appendChild(
                number
            );


            header.appendChild(
                status
            );


            // ==================================
            // QUESTION
            // ==================================

            const questionText =
                document.createElement(
                    "h3"
                );


            questionText.textContent =
                question.question;


            // ==================================
            // OPTIONS
            // ==================================

            const options =
                document.createElement(
                    "div"
                );


            options.className =
                "review-options";


            [
                "A",
                "B",
                "C",
                "D"
            ].forEach(
                letter => {

                    const option =
                        document.createElement(
                            "div"
                        );


                    option.className =
                        "review-option";


                    // User answer

                    if (
                        userAnswer ===
                        letter
                    ) {

                        option.classList.add(
                            "user-answer"
                        );

                    }


                    // Correct answer

                    if (
                        question.answer ===
                        letter
                    ) {

                        option.classList.add(
                            "correct-answer"
                        );

                    }


                    const letterSpan =
                        document.createElement(
                            "strong"
                        );


                    letterSpan.textContent =
                        `${letter}.`;


                    const textSpan =
                        document.createElement(
                            "span"
                        );


                    textSpan.textContent =
                        question.options[
                            letter
                        ];


                    option.appendChild(
                        letterSpan
                    );


                    option.appendChild(
                        textSpan
                    );


                    options.appendChild(
                        option
                    );

                }
            );


           


            card.insertBefore(
                header,
                card.firstChild
            );


            card.appendChild(
                questionText
            );


            card.appendChild(
                options
            );


            reviewContainer.appendChild(
                card
            );

        }
    );

}


// ============================================
// REVIEW BUTTON
// ============================================

reviewButton.addEventListener(
    "click",
    () => {

        const reviewSection =
            document.getElementById(
                "review-section"
            );


        reviewSection.scrollIntoView({
            behavior: "smooth"
        });

    }
);


// ============================================
// HOME BUTTON
// ============================================

homeButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "index.html";

    }
);


// ============================================
// FORMAT TIME
// ============================================

function formatTime(
    seconds
) {

    const minutes =
        Math.floor(
            seconds / 60
        );


    const remainingSeconds =
        seconds % 60;


    return `${String(
        minutes
    ).padStart(
        2,
        "0"
    )}:${String(
        remainingSeconds
    ).padStart(
        2,
        "0"
    )}`;

}


// ============================================
// FORMAT TEXT
// ============================================

function formatText(
    text
) {

    if (!text) {

        return "";

    }


    return text
        .replaceAll(
            "-",
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}