document.addEventListener(
"DOMContentLoaded",
initializeSettings
);

// ============================================
// INITIALIZE SETTINGS
// ============================================

async function initializeSettings() {


try {

    const response =
        await fetch(
            "/api/auth/me"
        );


    const data =
        await response.json();


    // ========================================
    // NOT LOGGED IN
    // ========================================

    if (
        !data.authenticated
    ) {

        window.location.href =
            "login.html";

        return;

    }


    // ========================================
    // DISPLAY USER
    // ========================================

    const user =
        data.user;


    const nameElement =
        document.getElementById(
            "user-name"
        );


    const emailElement =
        document.getElementById(
            "user-email"
        );


    const roleElement =
        document.getElementById(
            "user-role"
        );


    if (nameElement) {

        nameElement.textContent =
            user.name || "—";

    }


    if (emailElement) {

        emailElement.textContent =
            user.email || "—";

    }


    if (roleElement) {

        roleElement.textContent =
            formatRole(
                user.role
            );

    }

        // ========================================
    // ADMINISTRATOR TOOLS
    // ========================================

    if (user.role === "admin") {

        const adminTools =
            document.getElementById("admin-tools");

        if (adminTools) {
            adminTools.hidden = false;
        }

        initializeAdminTools();

    }


    // ========================================
    // LOAD SAVED PREFERENCES
    // ========================================

    loadPreferences();
    initializeAccountDeletion();

}

catch (error) {

    console.error(
        "Settings initialization error:",
        error
    );

    showMessage(
        "Could not load your account information."
    );

}
 

}

// ============================================
// FORMAT ROLE
// ============================================

function formatRole(
role
) {


if (
    role === "admin"
) {

    return "Administrator";

}


return "Student";


}

// ============================================
// PREFERENCES
// ============================================

function loadPreferences() {

 
const showExplanations =
    document.getElementById(
        "show-explanations"
    );


const confirmSubmit =
    document.getElementById(
        "confirm-submit"
    );


const savedExplanations =
    localStorage.getItem(
        "cbt_show_explanations"
    );


const savedConfirm =
    localStorage.getItem(
        "cbt_confirm_submit"
    );


if (
    savedExplanations !== null
) {

    showExplanations.checked =
        savedExplanations === "true";

}


if (
    savedConfirm !== null
) {

    confirmSubmit.checked =
        savedConfirm === "true";

}


// ========================================
// SAVE CHANGES
// ========================================

showExplanations.addEventListener(
    "change",
    () => {

        localStorage.setItem(
            "cbt_show_explanations",
            showExplanations.checked
        );

    }
);


confirmSubmit.addEventListener(
    "change",
    () => {

        localStorage.setItem(
            "cbt_confirm_submit",
            confirmSubmit.checked
        );

    }
);
 

}

// ============================================
// LOGOUT
// ============================================

const logoutButton =
document.getElementById(
"settings-logout"
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

// ============================================
// MESSAGE
// ============================================

function showMessage(
message
) {


const element =
    document.getElementById(
        "settings-message"
    );


if (!element) {

    return;

}


element.textContent =
    message;


}


// ============================================
// ADMINISTRATOR TOOLS
// ============================================

function initializeAdminTools() {

    const form =
        document.getElementById("promote-user-form");

    const emailInput =
        document.getElementById("promote-user-email");

    const button =
        document.getElementById("promote-user-button");

    const message =
        document.getElementById("promote-user-message");

    if (!form || !emailInput || !button || !message) {
        return;
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            emailInput.value.trim().toLowerCase();

        if (!email) {
            message.textContent =
                "Enter the registered user's email address.";
            return;
        }

        const confirmed = window.confirm(
            `Promote ${email} to administrator?\n\n` +
            "Only promote people you trust with access to question-bank uploads."
        );

        if (!confirmed) {
            return;
        }

        button.disabled = true;
        message.textContent = "Processing promotion...";

        try {

            const response = await fetch(
                "/api/admin/promote-user",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({ email })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                message.textContent =
                    data.error || "Could not promote this user.";

                return;
            }

            message.textContent =
                data.message ||
                "User promoted successfully.";

            emailInput.value = "";

        } catch (error) {

            console.error(
                "User promotion error:",
                error
            );

            message.textContent =
                "A network error occurred. Please try again.";

        } finally {

            button.disabled = false;

        }

    });

}

// ============================================
// ACCOUNT DELETION
// ============================================

function initializeAccountDeletion() {

    const form =
        document.getElementById(
            "delete-account-form"
        );

    const passwordInput =
        document.getElementById(
            "delete-account-password"
        );

    const button =
        document.getElementById(
            "delete-account-button"
        );

    const message =
        document.getElementById(
            "delete-account-message"
        );

    if (!form || !passwordInput || !button || !message) {
        return;
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const password = passwordInput.value;

        const confirmed = window.confirm(
            "Are you absolutely sure you want to delete your account?\n\n" +
            "Your account and associated test history will be permanently deleted."
        );

        if (!confirmed) {
            return;
        }

        button.disabled = true;
        message.textContent = "Deleting your account...";

        try {

            const response = await fetch(
                "/api/auth/account",
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                message.textContent =
                    data.error || "Could not delete your account.";

                return;
            }

            message.textContent =
                "Account deleted successfully. Redirecting...";

            passwordInput.value = "";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {

            console.error(
                "Account deletion error:",
                error
            );

            message.textContent =
                "A network error occurred. Please try again.";

        } finally {

            button.disabled = false;

        }

    });

}
