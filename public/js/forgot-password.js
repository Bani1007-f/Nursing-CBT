const form = document.getElementById("forgot-password-form");
const message = document.getElementById("message");
const submitButton = document.getElementById("submit-button");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
        const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: document.getElementById("email").value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not process your request.");
        }

        message.textContent = data.message;

    } catch (error) {
        message.textContent = error.message;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Send Reset Link";
    }
});