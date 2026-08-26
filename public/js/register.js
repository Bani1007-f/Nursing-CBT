const registerForm =
    document.getElementById(
        "register-form"
    );

const errorElement =
    document.getElementById(
        "register-error"
    );


registerForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        errorElement.textContent = "";


        const name =
            document.getElementById(
                "name"
            ).value.trim();


        const email =
            document.getElementById(
                "email"
            ).value.trim();


        const password =
            document.getElementById(
                "password"
            ).value;


        const confirmPassword =
            document.getElementById(
                "confirm-password"
            ).value;


        // ========================================
        // PASSWORD MATCH
        // ========================================

        if (
            password !==
            confirmPassword
        ) {

            errorElement.textContent =
                "Passwords do not match.";

            return;

        }


        // ========================================
        // SEND REQUEST
        // ========================================

        try {

            const response =
                await fetch(
                    "/api/auth/register",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                name,
                                email,
                                password

                            })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                errorElement.textContent =
                    data.error ||
                    "Could not create account.";

                return;

            }


            // ====================================
            // SUCCESS
            // ====================================

            window.location.href =
                "index.html";

        }

        catch (error) {

            console.error(
                error
            );

            errorElement.textContent =
                "Could not connect to the server.";

        }

    }
);