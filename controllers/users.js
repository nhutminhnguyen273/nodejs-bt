let userSchema = require('../schemas/user')
let roleSchema = require('../schemas/role');
let bcrypt = require('bcrypt')
module.exports = {
    getAllUsers: async function () {
        return userSchema.find({})
    },
    getUserById: async function (id) {
        return userSchema.findById(id).populate('role')
    },
    getUserByUsername: async function (username) {
        return userSchema.findOne({
            username: username
        })
    },
    createAnUser: async function (username, password, email, roleI) {
        try {
            // Check if username already exists
            let existingUser = await this.getUserByUsername(username);
            if (existingUser) {
                throw new Error('Username already exists');
            }

            // Find role
            let role = await roleSchema.findOne({
                name: roleI
            });
            if (!role) {
                throw new Error('Role does not exist');
            }

            // Hash password
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            // Create new user
            let newUser = new userSchema({
                username: username,
                password: hashedPassword,
                email: email,
                role: role._id,
                status: true
            });

            // Save user
            const savedUser = await newUser.save();
            return savedUser;
        } catch (error) {
            throw error;
        }
    },
    updateAnUser: async function (id, body) {
        let updatedUser = await this.getUserById(id);
        let allowFields = ["password", "email"];
        for (const key of Object.keys(body)) {
            if (allowFields.includes(key)) {
                updatedUser[key] = body[key]
            }
        }
        await updatedUser.save();
        return updatedUser;
    },
    deleteAnUser: async function (id) {
        let updatedUser = await userSchema.findByIdAndUpdate(
            id, {
            status: false
        }, { new: true }
        )
        return updatedUser;
    },
    checkLogin: async function(username, password) {
        try {
            // Find user and populate role
            let user = await userSchema.findOne({ username: username }).populate('role');
            if (!user) {
                throw new Error("Username or password is incorrect");
            }

            // Check if user is active
            if (!user.status) {
                throw new Error("Account is deactivated");
            }
            
            // Compare password with hashed password
            const isPasswordValid = bcrypt.compareSync(password, user.password);
            if (!isPasswordValid) {
                throw new Error("Username or password is incorrect");
            }
            
            // Increment login count
            user.loginCount += 1;
            await user.save();
            
            return user._id;
        } catch (error) {
            throw error;
        }
    },
    changePassword: async function(user, oldpassword, newpassword) {
        try {
            // First verify the old password
            if (!bcrypt.compareSync(oldpassword, user.password)) {
                throw new Error("Old password is incorrect");
            }

            // Hash the new password
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(newpassword, salt);
            
            // Update user's password with the hashed version
            user.password = hashedPassword;
            return await user.save();
        } catch (error) {
            throw error;
        }
    }
}