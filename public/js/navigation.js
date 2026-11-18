// ============================================
// GLOBAL NAVIGATION
// ============================================

async function loadNavigation() {

    const nav =
         document.getElementById("main-nav");

    if (!nav) {
        return;
    }


    // ========================================
    // CHECK CURRENT USER
    // ========================================

    try {

        const response =
            await fetch(
                "/api/auth/me"
            );


        const data =
            await response.json();


        // ========================================
        // LOGGED OUT
        // ========================================

        if (
            !data.authenticated
        ) {

            nav.innerHTML = `

                <a href="index.html">
                    Home
                </a>

                <a href="login.html">
                    Login
                </a>

                <a href="register.html">
                    Register
                </a>

            `;

            return;

        }


        // ========================================
        // LOGGED IN
        // ========================================

        const user =
            data.user;


        let links = `

            <a href="index.html">
                Home
            </a>

            <a href="history.html">
                History
            </a>

            <a href="dashboard.html">
                Dashboard
            </a>

            <a href="settings.html">
                Settings
            </a>

        `;


        // ========================================
        // ADMIN ONLY
        // ========================================

        if (
            user &&
            user.role === "admin"
        ) {

            links += `

                <a href="upload.html">
                    Upload
                </a>

                <a href="course-banks.html">
                    Course & Banks
                </a>

            `;

        }


        // ========================================
        // LOGOUT
        // ========================================

        links += `

            <button
                type="button"
                id="logout-button"
            >
                Logout
            </button>

        `;


        nav.innerHTML =
            links;


        // ========================================
        // LOGOUT HANDLER
        // ========================================

        const logoutButton =
            document.getElementById(
                "logout-button"
            );


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

                    }

                    catch (error) {

                        console.error(
                            "Logout error:",
                            error
                        );

                    }


                    window.location.href =
                        "index.html";

                }
            );

        }

    }

    catch (error) {

        console.error(
            "Navigation error:",
            error
        );


        // If authentication check
        // fails, still provide basic navigation.

        nav.innerHTML = `

            <a href="index.html">
                Home
            </a>

            <a href="login.html">
                Login
            </a>

            <a href="register.html">
                Register
            </a>

        `;

    }

}


// ============================================
// START
// ============================================

loadNavigation();