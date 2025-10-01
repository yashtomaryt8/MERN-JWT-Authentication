import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userModel from './../models/userModel.js'
import transporter from './../config/nodemailer.js';

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

         // Send welcome email
    try {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Welcome to Our Authentication System",
        text: `Hello ${name},\n\nYour account has been created successfully with email: ${email}\n\nWelcome aboard!`,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
    } catch (error) {
      console.error("Error sending email:", error);
      // we log error but still continue with registration response
    }

    // Final response
    return res.json({
      success: true,
      message: "User registered successfully",
      user: { name: user.name, email: user.email, id: user._id },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
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

// Send Verification OTP to the User's Email
export const sendVerifyOtp = async (req, res) =>{
    try {
        const userId = req.user.id
        
        const user = await userModel.findById(userId)

        if(user.isAccountVerified){
            return res.status(409).json({ success: false, message: 'User is already verified' })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))

        user.verifyOtp = otp
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

        await user.save()

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification OTP",
            text: `Your OTP is ${otp}. Verify your account using this OTP.`,
        }

        await transporter.sendMail(mailOption)

        res.json({success: true, message: 'OTP sent to your email', userId: user._id})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

// Verify the OTP entered by the User
export const verifyEmail = async (req, res) => {
  try {
    // Ensure request is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized user!" });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required!" });
    }

    const userId = req.user.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User does not exist!" });
    }
    console.log(user.verifyOtp, otp);
    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP!" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired!" });
    }

    // Mark account as verified
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();

    return res.status(200).json({ success: true, message: "Email verified successfully" });

  } catch (error) {
    console.error("Error in verifyEmail:", error);
    return res.status(500).json({ success: false, message: "Server error, please try again." });
  }
};

// Check if the user is authenticated
export const isAuthenticated = async (req, res) =>{
    try {
        return res.json({success: true, user: req.user})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

// Send Password Reset OTP
export const sendResetOtp = async (req, res) => {
    const {email} = req.body

    if(!email) {
        return res.json({success: false, message: 'Email is required!'}) 
    }
    try {
        const user = await userModel.findOne({email})
        if(!user) {
            return res.json({success: false, message: 'User does not exist!'})
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))

        user.resetOtp = otp
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000 // 15 minutes

        await user.save()

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password Reset OTP",
            text: `Your OTP for reseting you Password is ${otp}. Use this OTP to proceed with resetting your password.`,
        }

        await transporter.sendMail(mailOption)

        res.json({success: true, message: 'OTP sent to your email', userId: user._id})

    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

// Reset Password using OTP
export const resetPassword = async (req, res) => {
    
    const {email, otp, newPassword} = req.body

    if(!email || !otp || !newPassword) {
        return res.json({success: false, message: 'Missing Details!'}) 
    }
    try {
        const user = await userModel.findOne({email})
        if(!user){
            return res.json({success: false, message: 'User does not exist!'})
        }

        if(user.resetOtp === '' || user.resetOtp !== otp){
            return res.json({success: false, message: 'Invalid OTP!'})
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success: false, message: 'OTP Expired!'})
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        user.password = hashedPassword
        user.resetOtp = ''
        user.resetOtpExpireAt = 0
        
        await user.save()

        return res.json({success: true, message: 'Password Reset Successful!'})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

