const loginForm =
    document.getElementById(
        "login-form"
    );

const errorElement =
    document.getElementById(
        "login-error"
    );


loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        errorElement.textContent = "";


        const email =
            document.getElementById(
                "email"
            ).value.trim();


        const password =
            document.getElementById(
                "password"
            ).value;


        try {

            const response =
                await fetch(
                    "/api/auth/login",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

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
                    "Invalid email or password.";

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