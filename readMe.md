 # 1 Create two folders client and server

 # 2 Create server.js file in server folder

 # 3 npm init ENter all and remove test file in package.json

 # 4 Install these dependencies -> npm i cors express dotenv nodemon mongoose jsonwebtoken bcryptjs nodemailer cookie-parser

 # 5 In package.json type -> module [for import export]

 # 6 start coding in first Server.js


<!-- import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'

const app = express()
const PORT = process.env.PORT || 4000

// Middlewares
app.use(express.json())
app.use(cookieParser())
app.use(cors({credentials: true}))


app.get("/", (req, res) => {
    res.send("API Working")
})

app.listen(PORT, () => {
    console.log(`Server is running on PORT http://localhost:${PORT}`)
}) -->



# 7 In Package.json -> "server": "nodemon server.js"
 
# 8 MongoDB connection -> 