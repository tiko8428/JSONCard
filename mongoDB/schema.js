// const mongoose = require("mongoose");
/**
 * @openapi
 * components:
 *  schemas:
 *    CreateUserInput:
 *      type: object
 *      required:
 *        - email
 *        - given_name
 *        - family_name
 *        - id_token
 *      properties:
 *        email:
 *          type: string
 *          default: jane.doe@example.com
 *        given_name:
 *          type: string
 *          default: Jane
 *        family_name:
 *          type: string
 *          default: Doe
 *        id_token:
 *          type: string
 *          default: tokenFromApple
 *    CreateUserResponse:
 *      type: object
 *      properties:
 *        email:
 *          type: string
 *        given_name:
 *          type: string
 *        family_name:
 *          type: string
 *        id_token:
 *          type: string
 *        _id:
 *          type: string
 *        createdAt:
 *          type: string
 *        updatedAt:
 *          type: string
 */

// const userSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//     },
//     given_name: {
//       type: String,
//     },
//     family_name: {
//       type: String,
//     },
//     id_token: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//   },
//   { timestamps: true }
// );

// const User = mongoose.model("user", userSchema);

// module.exports = {
//   User,
// };
