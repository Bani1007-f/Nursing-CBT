// ============================================
// ATTEMPT REVIEW
// ============================================


// ============================================
// GET ATTEMPT ID
// ============================================

const params =
    new URLSearchParams(
        window.location.search
    );


const attemptId =
    params.get("id");


// ============================================
// ELEMENTS
// ============================================

const attemptCourse =
    document.getElementById(
        "attempt-course"
    );


const attemptTopic =
    document.getElementById(
        "attempt-topic"
    );


const attemptSummary =
    document.getElementById(
        "attempt-summary"
    );


const attemptQuestions =
    document.getElementById(
        "attempt-questions"
    );


// ============================================
// INITIALIZE
// ============================================

if (!attemptId) {

    attemptQuestions.innerHTML = `

        <p>
            No test result was specified.
        </p>

        <a href="history.html">
            Back to History
        </a>

    `;

}

else {

    loadAttempt();

}


// ============================================
// LOAD ATTEMPT
// ============================================

async function loadAttempt() {

    try {

        const response =
            await fetch(
                `/api/attempts/${encodeURIComponent(
                    attemptId
                )}`
            );


        const data =
            await response.json();


        // ========================================
        // NOT LOGGED IN
        // ========================================

        if (
            response.status === 401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not load test result."
            );

        }


        displayAttempt(
            data.attempt,
            data.questions
        );

    }

    catch (error) {

        console.error(
            "Attempt review error:",
            error
        );


        attemptQuestions.innerHTML = `

            <p>
                Unable to load this test result.
            </p>

            <a href="history.html">
                Back to History
            </a>

        `;

    }

}


// ============================================
// DISPLAY ATTEMPT
// ============================================

function displayAttempt(
    attempt,
    questions
) {

    attemptCourse.textContent =
        formatText(
            attempt.course
        );


    attemptTopic.textContent =
        formatText(
            attempt.topic
        );


    const percentage =
        Number(
            attempt.percentage
        ).toFixed(0);


    attemptSummary.innerHTML = `

        <div class="attempt-stat">

            <span>
                SCORE
            </span>

            <strong>
                ${attempt.score}/${attempt.total_questions}
            </strong>

        </div>


        <div class="attempt-stat">

            <span>
                PERCENTAGE
            </span>

            <strong>
                ${percentage}%
            </strong>

        </div>


        <div class="attempt-stat">

            <span>
                TIME
            </span>

            <strong>
                ${formatTime(
                    attempt.time_taken
                )}
            </strong>

        </div>

    `;


    attemptQuestions.innerHTML =
        "";


    if (
        questions.length === 0
    ) {

        attemptQuestions.innerHTML = `

            <p>
                No question details were saved
                for this attempt.
            </p>

        `;

        return;

    }


    questions.forEach(
    (question, index) => {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            question.isCorrect
                ? "review-question correct"
                : "review-question incorrect";


        const selected =
            question.selectedAnswer ||
            "Not answered";


        const correct =
            question.correctAnswer ||
            "—";


        const selectedText =
            question.options &&
            question.options[selected]
                ? `${selected}. ${question.options[selected]}`
                : selected;


        const correctText =
            question.options &&
            question.options[correct]
                ? `${correct}. ${question.options[correct]}`
                : correct;


        card.innerHTML = `

            <div class="review-question-header">

                <span>
                    Question ${index + 1}
                </span>

                <strong>
                    ${
                        question.isCorrect
                            ? "✓ Correct"
                            : "✗ Incorrect"
                    }
                </strong>

            </div>


            <div class="review-question-body">

                <h3>
                    ${escapeHtml(
                        question.question ||
                        "Question unavailable"
                    )}
                </h3>


                <div class="review-answer-row">

                    <span>
                        Your answer
                    </span>

                    <strong>
                        ${escapeHtml(
                            selectedText
                        )}
                    </strong>

                </div>


                <div class="review-answer-row">

                    <span>
                        Correct answer
                    </span>

                    <strong>
                        ${escapeHtml(
                            correctText
                        )}
                    </strong>

                </div>


                ${
                    question.explanation
                        ? `
                            <div class="review-explanation">

                                <strong>
                                    Explanation
                                </strong>

                                <p>
                                    ${escapeHtml(
                                        question.explanation
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }

            </div>

        `;


        attemptQuestions.appendChild(
            card
        );

    }
);
}


// ============================================
// FORMAT TIME
// ============================================

function formatTime(
    seconds
) {

    if (
        !Number.isFinite(
            Number(seconds)
        )
    ) {

        return "—";

    }


    const totalSeconds =
        Number(seconds);


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const remainingSeconds =
        totalSeconds % 60;


    return `${minutes}m ${String(
        remainingSeconds
    ).padStart(2, "0")}s`;

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


// ============================================
// HTML SAFETY
// ============================================

function escapeHtml(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}