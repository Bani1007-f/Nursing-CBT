const bcrypt =
    require("bcrypt");

const db =
    require("../database/db");


// ============================================
// REGISTER USER
// ============================================

function registerUser(
    name,
    email,
    password
) {

    // ----------------------------------------
    // CLEAN INPUT
    // ----------------------------------------

    name =
        name.trim();

    email =
        email.trim().toLowerCase();


    // ----------------------------------------
    // CHECK REQUIRED FIELDS
    // ----------------------------------------

    if (
        !name ||
        !email ||
        !password
    ) {

        return {

            success:
                false,

            error:
                "Name, email and password are required."

        };

    }


    // ----------------------------------------
    // BASIC PASSWORD CHECK
    // ----------------------------------------

    if (
        password.length < 6
    ) {

        return {

            success:
                false,

            error:
                "Password must be at least 6 characters."

        };

    }


    // ----------------------------------------
    // CHECK EXISTING USER
    // ----------------------------------------

    const existingUser =
        db.prepare(`
            SELECT id
            FROM users
            WHERE email = ?
        `).get(email);


    if (existingUser) {

        return {

            success:
                false,

            error:
                "An account with this email already exists."

        };

    }


    // ----------------------------------------
    // HASH PASSWORD
    // ----------------------------------------

    const passwordHash =
        bcrypt.hashSync(
            password,
            12
        );


    // ----------------------------------------
    // CREATE USER
    // ----------------------------------------

    try {

        const result =
            db.prepare(`
                INSERT INTO users (
                    name,
                    email,
                    password_hash
                )
                VALUES (?, ?, ?)
            `).run(
                name,
                email,
                passwordHash
            );


        return {

            success:
                true,

            user: {

                id:
                    result.lastInsertRowid,

                name,

                email

            }

        };

    }

    catch (error) {

        console.error(
            "Registration error:",
            error
        );


        return {

            success:
                false,

            error:
                "Could not create the account."

        };

    }

}


// ============================================
// LOGIN USER
// ============================================

function loginUser(
    email,
    password
) {

    email =
        email.trim().toLowerCase();


    const user =
        db.prepare(`
            SELECT
                id,
                name,
                email,
                password_hash
            FROM users
            WHERE email = ?
        `).get(email);


    if (!user) {

        return {

            success:
                false,

            error:
                "Invalid email or password."

        };

    }


    const passwordMatches =
        bcrypt.compareSync(
            password,
            user.password_hash
        );


    if (!passwordMatches) {

        return {

            success:
                false,

            error:
                "Invalid email or password."

        };

    }


    return {

        success:
            true,

        user: {

            id:
                user.id,

            name:
                user.name,

            email:
                user.email

        }

    };

}


// ============================================
// VERIFY CURRENT PASSWORD
// ============================================

function verifyUserPassword(
    userId,
    password
) {

    if (
        typeof password !== "string" ||
        !password
    ) {
        return false;
    }

    const user = db.prepare(`
        SELECT password_hash
        FROM users
        WHERE id = ?
    `).get(userId);

    if (!user) {
        return false;
    }

    return bcrypt.compareSync(
        password,
        user.password_hash
    );

}

// ============================================
// GET USER
// ============================================

function getUserById(
    userId
) {

    return db.prepare(`
        SELECT
            id,
            name,
            email,
            role,
            created_at
        FROM users
        WHERE id = ?
    `).get(userId);

}

// ============================================
// RESET USER PASSWORD
// ============================================

function resetUserPassword(userId, newPassword) {
    if (
        typeof newPassword !== "string" ||
        newPassword.length < 6
    ) {
        return false;
    }

    const passwordHash = bcrypt.hashSync(newPassword, 12);

    const result = db.prepare(`
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
    `).run(passwordHash, userId);

    return result.changes > 0;
}

module.exports = {

    registerUser,

    loginUser,

    getUserById,
    
    verifyUserPassword,
    resetUserPassword

};