import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userModel from './../models/userModel.js'

export const register = async (req, res) => {
    const {name, email, password} = req.body

    if(!name || !email || !password) {
        return res.json({success: false, message: 'Missing Details!'}) 
    }

    try {

        const existingUser = await userModel.findOne({email})

        if(existingUser) {
            return res.json({success: false, message: 'User already exists!'})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = new userModel({name, email, password: hashedPassword})

        await user.save()

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'})

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        return res.json({success: true, message: 'User registered successfully', user: {name: user.name, email: user.email, id: user._id}})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body

    if(!email || !password) {
        return res.json({success: false, message: 'Email and Password are required!'}) 
    }

    try {
        
        const user = await userModel.findOne({email})

        if(!user){
            return res.json({success: false, message: 'User does not exist!'})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch) {
            return res.json({success: false, message: 'Incorrect Password!'})
        }
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'})

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        return res.json({success: true, message: 'User logged in successfully', user: {name: user.name, email: user.email, id: user._id}})

    } catch (error) {
        res.json({success: false, message: error.message})
    }

}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })

        return res.json({success: true, message: 'User logged out successfully'})
        
    } catch (error) {
        return res.json({success: false, message: error.message})
    }


}