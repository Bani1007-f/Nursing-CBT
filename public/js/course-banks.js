const courseList = document.getElementById("course-list");
const managerMessage = document.getElementById("manager-message");
const folderMessage = document.getElementById("folder-message");
const folderSummary = document.getElementById("folder-summary");
const createFolderForm = document.getElementById("create-folder-form");

let managerData = {
    courses: [],
    folders: []
};

async function checkManagerAccess() {
    try {
        const response = await fetch("/api/auth/me", {
            credentials: "include"
        });

        if (!response.ok) {
            location.href = "login.html?redirect=course-banks.html";
            return false;
        }

        const data = await response.json();

        if (!data.user || data.user.role !== "admin") {
            document.querySelector(".bank-manager").innerHTML =
                "<h1>Access denied</h1><p>Administrator access is required.</p>";
            return false;
        }

        return true;
    } catch (error) {
        location.href = "login.html?redirect=course-banks.html";
        return false;
    }
}

async function loadManagerData() {
    courseList.textContent = "Loading courses...";

    try {
        const response = await fetch("/api/admin/course-banks", {
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not load course information.");
        }

        managerData = data;
        renderFolders();
        renderCourses();
    } catch (error) {
        courseList.textContent = error.message;
    }
}

function renderFolders() {
    folderSummary.innerHTML = "";

    if (!managerData.folders.length) {
        folderSummary.textContent = "No question-bank folders have been created yet.";
        return;
    }

    managerData.folders.forEach(folder => {
        const chip = document.createElement("span");
        chip.className = "folder-chip";
        chip.textContent = folder;
        folderSummary.appendChild(chip);
    });
}

function renderCourses() {
    courseList.innerHTML = "";

    if (!managerData.courses.length) {
        courseList.textContent = "No curriculum courses were found.";
        return;
    }

    managerData.courses.forEach(course => {
        const card = document.createElement("article");
        card.className = "course-card";

        const details = document.createElement("div");

        const heading = document.createElement("h3");
        heading.textContent = `${course.code} — ${course.title}`;

        const meta = document.createElement("div");
        meta.className = "course-meta";
        meta.textContent = `${course.level} · ${course.semester}`;

        details.append(heading, meta);

        const select = document.createElement("select");
        select.setAttribute("aria-label", `Question-bank folder for ${course.code}`);

        const unassigned = document.createElement("option");
        unassigned.value = "";
        unassigned.textContent = "Not assigned";
        select.appendChild(unassigned);

        managerData.folders.forEach(folder => {
            const option = document.createElement("option");
            option.value = folder;
            option.textContent = folder;
            select.appendChild(option);
        });

        select.value = course.bankFolder || "";

        const saveButton = document.createElement("button");
        saveButton.className = "manager-button";
        saveButton.type = "button";
        saveButton.textContent = "Save";
        saveButton.addEventListener("click", () => {
            saveAssignment(course.id, select.value, saveButton);
        });

        card.append(details, select, saveButton);
        courseList.appendChild(card);
    });
}

async function saveAssignment(courseId, folderName, button) {
    button.disabled = true;
    button.textContent = "Saving...";
    managerMessage.textContent = "";

    try {
        const response = await fetch("/api/admin/course-banks/assign", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, folderName })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Could not save assignment.");
        }

        managerMessage.textContent = result.message;
        await loadManagerData();
    } catch (error) {
        managerMessage.textContent = error.message;
    } finally {
        button.disabled = false;
        button.textContent = "Save";
    }
}

createFolderForm.addEventListener("submit", async event => {
    event.preventDefault();

    const input = document.getElementById("folder-name");
    const name = input.value.trim();

    if (!name) return;

    folderMessage.textContent = "Creating folder...";

    try {
        const response = await fetch("/api/admin/course-banks/folders", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Could not create folder.");
        }

        folderMessage.textContent = result.message;
        input.value = "";
        await loadManagerData();
    } catch (error) {
        folderMessage.textContent = error.message;
    }
});

(async function initialiseManager() {
    if (await checkManagerAccess()) {
        await loadManagerData();
    }
})();
