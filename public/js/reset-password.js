const form = document.getElementById("reset-password-form");
const message = document.getElementById("message");
const submitButton = document.getElementById("submit-button");

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (!token) {
    form.hidden = true;
    message.textContent =
        "This reset link is missing or invalid. Please request a new one.";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
        message.textContent = "The passwords do not match.";
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Resetting...";
    message.textContent = "";

    try {
        const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token,
                password,
                confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not reset your password.");
        }

        message.textContent = data.message;
        form.reset();

        // Give the user a moment to read the success message.
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        message.textContent = error.message;
        submitButton.disabled = false;
        submitButton.textContent = "Reset Password";
    }
});