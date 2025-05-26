import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import Joi from "joi";

dotenv.config();
const app = express();

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db;

try {
    await mongoClient.connect()
    console.log("Conexão estabelecida com sucesso!")
    db = mongoClient.db()
} catch (err) {
    console.log(err)
}

app.post("/sign-up", async(req, res) => {
    const user = req.body;

    const userSchema = Joi.object({
        username: Joi.string().required(),
        avatar: Joi.string().required()
    })

    const validation = userSchema.validate(user, {abortEarly: false})

    if(validation.error){
        const errors = validation.error.details.map(detail => detail.message)
        return res.status(422).send(errors)
    }

    try {
        await db.collection("users").insertOne(user)
        res.sendStatus(201)
    } catch (error) {
        res.status(500).send(err)
    }
})

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Servidor rodando liso na porta ${port}`)
})

app.post("/tweets", async(req, res) => {
    const { username, tweet } = req.body

    const tweetSchema = Joi.object({
        username: Joi.string().required(),
        tweet: Joi.string().required()
    })

    const validation = tweetSchema.validate(req.body, {abortEarly: false})

    if(validation.error){
        const errors = validation.error.details.map(detail => detail.message)
        res.status(422).send(errors)
    }

    try {
        const user = await db.collection("users").findOne({username})
        if(!user){
            return res.sendStatus(401)
        }

        const newTweet = {
            username : user.username,
            tweet,
        }

        await db.collection("tweets").insertOne(newTweet)
        return res.sendStatus(201)
        
    } catch (err) {
        res.status(500).send(err)
    }
})