import userModel from '../models/userModel.js'

export const getUserData = async (req, res) => {
    try {
        const userId = req.user.id

        // console.log("Incoming user:", req.user)

        const user = await userModel.findById(userId)
    
        if (!user) {
            return res.json({ success: false, message: 'User does not exist!' });
        }

        res.json({
            success: true,
            userData: {
                name: user.name,
                email: user.email,
                isAccountVerified: user.isAccountVerified
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
