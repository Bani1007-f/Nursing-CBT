// ============================================
// TEST HISTORY
// ============================================


// ============================================
// ELEMENTS
// ============================================

const historyLoading =
    document.getElementById(
        "history-loading"
    );


const historyEmpty =
    document.getElementById(
        "history-empty"
    );


const historyList =
    document.getElementById(
        "history-list"
    );


const logoutButton =
    document.getElementById(
        "logout-button"
    );


// ============================================
// INITIALIZE
// ============================================

loadHistory();


// ============================================
// LOAD HISTORY
// ============================================

async function loadHistory() {

    try {

        const response =
            await fetch(
                "/api/attempts"
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
                "Could not load history."
            );

        }


        const attempts =
            data.attempts || [];


        historyLoading.style.display =
            "none";


        // ========================================
        // EMPTY HISTORY
        // ========================================

        if (
            attempts.length === 0
        ) {

            historyEmpty.style.display =
                "block";

            return;

        }


        // ========================================
        // DISPLAY ATTEMPTS
        // ========================================

        historyList.innerHTML =
            "";


        attempts.forEach(
            attempt => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "history-card";
                card.dataset.attemptId =
    attempt.id;

card.style.cursor =
    "pointer";

card.addEventListener(
    "click",
    () => {

        window.location.href =
            `attempt.html?id=${attempt.id}`;

    }
);


                const percentage =
                    Number(
                        attempt.percentage
                    ).toFixed(0);


                const date =
                    formatDate(
                        attempt.completed_at
                    );


                card.innerHTML = `

                    <div class="history-main">

                        <h2 class="history-course">
                            ${escapeHtml(
                                attempt.course
                            )}
                        </h2>
                         <br>

                        <h3>
                            ${escapeHtml(
                                attempt.topic
                            )}
                        </h3>

                        <span class="history-date">
                            ${date}
                        </span>

                    </div>


                    <div class="history-score">

                        <strong>
                            ${percentage}%
                        </strong>

                        <span>
                            ${attempt.score}
                            /
                            ${attempt.total_questions}
                        </span>

                    </div>

                `;


                historyList.appendChild(
                    card
                );

            }
        );

    }

    catch (error) {

        console.error(
            "History error:",
            error
        );


        historyLoading.textContent =
            "Unable to load your test history.";

    }

}


// ============================================
// LOGOUT
// ============================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    "/api/auth/logout",
                    {
                        method: "POST"
                    }
                );

                window.location.href =
                    "login.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(dateString) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString.replace(
                " ",
                "T"
            ) + "Z"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleString(
        undefined,
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}


// ============================================
// HTML SAFETY
// ============================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}