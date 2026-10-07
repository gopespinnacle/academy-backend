/**
 * ============================================================
 * GPA MESSENGER
 * MODULE 5
 * CONTACTS
 * ============================================================
 *
 * PURPOSE:
 *
 * Load Academy users from the existing User collection
 * and provide them as Messenger contacts.
 *
 * Contacts currently include:
 *
 * - teacher
 * - student
 * - parent
 * - admin
 *
 * Founder is excluded from the contact list.
 *
 * IMPORTANT:
 *
 * Sensitive User fields are NOT returned.
 *
 * ============================================================
 */

const User = require("../../models/User");

class MessengerContacts {

    async getFounderContacts(founderId) {

        if (!founderId) {
            throw new Error(
                "[GPA MESSENGER CONTACTS] " +
                "Founder ID is required."
            );
        }

        console.log(
            "[GPA MESSENGER CONTACTS] " +
            "Loading Founder contacts..."
        );

        const contacts =
            await User.find({
                _id: {
                    $ne: founderId
                },

                role: {
                    $in: [
                        "teacher",
                        "student",
                        "parent",
                        "admin"
                    ]
                }
            })
            .select(
                "_id name email role grade board subject " +
                "mobile whatsapp studentId teacherId adminId"
            )
            .sort({
                name: 1
            })
            .lean();

        console.log(
            "[GPA MESSENGER CONTACTS] " +
            "Contacts loaded:",
            contacts.length
        );

        return contacts;
    }
}

module.exports =
    new MessengerContacts();