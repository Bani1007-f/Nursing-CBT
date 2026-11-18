
document.addEventListener("DOMContentLoaded", () => {

    const passwordFields = document.querySelectorAll(
        'input[type="password"]'
    );

    passwordFields.forEach((input) => {

        // Avoid adding duplicate buttons
        if (
            input.parentElement.classList.contains(
                "password-field-wrapper"
            )
        ) {
            return;
        }

        // Create wrapper
        const wrapper = document.createElement("div");

        wrapper.className = "password-field-wrapper";

        input.parentNode.insertBefore(
            wrapper,
            input
        );

        wrapper.appendChild(input);

        // Create toggle button
        const button = document.createElement("button");

        button.type = "button";
        button.className = "password-toggle";
        button.setAttribute("aria-label", "Show password");
        button.setAttribute("aria-pressed", "false");

        button.innerHTML = "👁";

        wrapper.appendChild(button);

        // Toggle visibility
        button.addEventListener("click", () => {

            const isHidden = input.type === "password";

            input.type = isHidden ? "text" : "password";

            button.innerHTML = isHidden ? "🙈" : "👁";

            button.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );

            button.setAttribute(
                "aria-pressed",
                String(isHidden)
            );

        });

    });

});
