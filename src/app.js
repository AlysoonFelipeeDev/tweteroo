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