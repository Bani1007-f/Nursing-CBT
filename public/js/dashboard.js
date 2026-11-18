// ============================================
// DASHBOARD
// ============================================



// ============================================
// ELEMENTS
// ============================================

const welcomeMessage =
    document.getElementById(
        "welcome-message"
    );


const totalTests =
    document.getElementById(
        "total-tests"
    );


const averageScore =
    document.getElementById(
        "average-score"
    );


const highestScore =
    document.getElementById(
        "highest-score"
    );


const totalQuestions =
    document.getElementById(
        "total-questions"
    );


const correctAnswers =
    document.getElementById(
        "correct-answers"
    );


const accuracy =
    document.getElementById(
        "accuracy"
    );


const recentTests =
    document.getElementById(
        "recent-tests"
    );


const coursePerformance =
    document.getElementById(
        "course-performance"
    );


const logoutButton =
    document.getElementById(
        "logout-button"
    );


// ============================================
// INITIALIZE
// ============================================

loadDashboard();


// ============================================
// LOAD DASHBOARD
// ============================================

async function loadDashboard() {

    try {

        // ----------------------------------------
        // GET CURRENT USER
        // ----------------------------------------

        const userResponse =
            await fetch(
                "/api/auth/me"
            );


        const userData =
            await userResponse.json();


        if (!userData.authenticated) {

    window.location.href =
        "login.html?redirect=dashboard.html";

    return;

}


        // ----------------------------------------
        // WELCOME MESSAGE
        // ----------------------------------------

        welcomeMessage.textContent =
            `Welcome back, ${userData.user.name}`;


        // ----------------------------------------
        // GET DASHBOARD DATA
        // ----------------------------------------

        const response =
            await fetch(
                "/api/dashboard"
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not load dashboard."
            );

        }


        displayStatistics(
            data.statistics
        );


        displayRecentTests(
            data.recentTests
        );


        displayCoursePerformance(
            data.coursePerformance
        );

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        recentTests.innerHTML = `
            <p>
                Unable to load dashboard data.
            </p>
        `;


        coursePerformance.innerHTML = `
            <p>
                Unable to load performance data.
            </p>
        `;

    }

}


// ============================================
// DISPLAY STATISTICS
// ============================================

function displayStatistics(
    statistics
) {

    totalTests.textContent =
        statistics.totalTests;


    averageScore.textContent =
        `${Number(
            statistics.averageScore
        ).toFixed(1)}%`;


    highestScore.textContent =
        `${Number(
            statistics.highestScore
        ).toFixed(0)}%`;


    totalQuestions.textContent =
        statistics.totalQuestions;


    correctAnswers.textContent =
        statistics.correctAnswers;


    const answered =
        Number(
            statistics.answeredQuestions
        );


    const correct =
        Number(
            statistics.correctAnswers
        );


    const calculatedAccuracy =
        answered > 0
            ? (correct / answered) * 100
            : 0;


    accuracy.textContent =
        `${calculatedAccuracy.toFixed(1)}%`;

}


// ============================================
// DISPLAY RECENT TESTS
// ============================================

function displayRecentTests(
    tests
) {

    recentTests.innerHTML =
        "";


    if (
        !tests ||
        tests.length === 0
    ) {

        recentTests.innerHTML = `
            <div class="empty-state">

                <p>
                    You haven't taken any tests yet.
                </p>

                <a href="index.html">
                    Start your first test →
                </a>

            </div>
        `;

        return;

    }


    tests.forEach(
        test => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "recent-test";


            item.innerHTML = `

                <div class="recent-test-info">

                    <strong>
                        ${escapeHtml(
                            formatText(
                                test.course
                            )
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            formatText(
                                test.topic
                            )
                        )}
                    </span>

                </div>


                <div class="recent-test-score">

                    <strong>
                        ${Number(
                            test.percentage
                        ).toFixed(0)}%
                    </strong>

                    <span>
                        ${test.score}/${test.total_questions}
                    </span>

                </div>


                <a
                    href="attempt.html?id=${encodeURIComponent(
                        test.id
                    )}"
                    class="review-link"
                >
                    Review →
                </a>

            `;


            recentTests.appendChild(
                item
            );

        }
    );

}


// ============================================
// DISPLAY COURSE PERFORMANCE
// ============================================

function displayCoursePerformance(
    courses
) {

    coursePerformance.innerHTML =
        "";


    if (
        !courses ||
        courses.length === 0
    ) {

        coursePerformance.innerHTML = `
            <p>
                No course performance data yet.
            </p>
        `;

        return;

    }


    courses.forEach(
        course => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "course-performance-item";


            const percentage =
                Number(
                    course.averageScore
                );


            item.innerHTML = `

                <div class="course-performance-header">

                    <strong>
                        ${escapeHtml(
                            formatText(
                                course.course
                            )
                        )}
                    </strong>

                    <span>
                        ${percentage.toFixed(1)}%
                    </span>

                </div>


                <div class="performance-bar">

                    <div
                        class="performance-bar-fill"
                        style="width: ${Math.min(
                            percentage,
                            100
                        )}%"
                    ></div>

                </div>


                <div class="course-performance-meta">

                    <span>
                        ${course.testsTaken} test${
                            course.testsTaken === 1
                                ? ""
                                : "s"
                        }
                    </span>

                    <span>
                        Best:
                        ${Number(
                            course.highestScore
                        ).toFixed(0)}%
                    </span>

                </div>

            `;


            coursePerformance.appendChild(
                item
            );

        }
    );

}


// ============================================
// LOGOUT
// ============================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            const response =
                await fetch(
                    "/api/auth/logout",
                    {
                        method: "POST"
                    }
                );


            if (
                response.ok
            ) {

                window.location.href =
                    "index.html";

            }

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


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