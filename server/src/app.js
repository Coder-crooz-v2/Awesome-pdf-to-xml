import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
dotenv.config({
  path: './.env'
})

const app = express()

const allowedOrigins = [
process.env.CORS_ORIGIN,          
"http://localhost:3000"                              // Local development URL
]

app.use(cors({
    origin: function(origin, callback) {
        
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from './routes/user.routes.js'
import documentRouter from './routes/document.routes.js'


app.use("/api/v1/users", userRouter)
app.use("/api/v1/documents", documentRouter)

export { app }