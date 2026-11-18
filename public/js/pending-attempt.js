
async function completePendingCbtAttempt() {
    const storedPending =
        sessionStorage.getItem("pendingCbtResult");

    if (!storedPending) {
        return false;
    }

    // Confirm that the user is authenticated.
    const authResponse = await fetch("/api/auth/me");
    if (!authResponse.ok) {
        return false;
    }

    const authData = await authResponse.json();

    if (authData.authenticated !== true) {
        return false;
    }

    const pending = JSON.parse(storedPending);

    // Save the guest's completed attempt to their account.
    const response = await fetch("/api/attempts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(pending.attempt)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Could not save your test attempt."
        );
    }

    // Make the result available to the protected results page.
    const attemptId =
        data.attempt?.id || data.attemptId;

    sessionStorage.setItem(
        "cbtResult",
        JSON.stringify({
            ...pending.result,
            attemptId,
            saved: true
        })
    );

    // Remove the temporary guest submission only after saving.
    sessionStorage.removeItem("pendingCbtResult");

    window.location.href = "results.html";

    return true;
}
