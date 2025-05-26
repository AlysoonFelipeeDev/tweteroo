import express, {json} from "express";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import Joi from "joi";
import cors from "cors";

dotenv.config();
const app = express();
app.use(json());
app.use(cors());

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
    } catch (err) {
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
        return res.status(422).send(errors)
    }

    try {
        const user = await db.collection("users").findOne({username})
        if(!user){
            return res.sendStatus(401)
        }

        const newTweet = {
            username : user.username,
            tweet,
            createdAt: new Date()
        }

        await db.collection("tweets").insertOne(newTweet)
        return res.sendStatus(201)
        
    } catch (err) {
        res.status(500).send(err)
    }
})

app.get("/tweets", async(req, res) => {
    try {
        const tweets = await db.collection("tweets")
        .find()
        .sort( {createdAt: -1} )
        .toArray()

            const fullTweets = await Promise.all(tweets.map(async (tweet) => {
            const user = await db.collection("users").findOne({username: tweet.username})
            
                return {
                    _id: tweet._id,
                    username: tweet.username,
                    avatar: user.avatar,
                    tweet: tweet.tweet
                };
            }))

            res.send(fullTweets)

    } catch (err) {
        res.status(500).send(err)
    }
})

app.put("/tweets/:id", async(req, res) => {
    const updateTweet = req.body;''
    const {id} = req.params;

    const tweetSchema = Joi.object({
        username: Joi.string().required(),
        tweet: Joi.string().required()
    })

    const validation = tweetSchema.validate(updateTweet, {abortEarly: false})

    if(validation.error){
        const errors = validation.error.details.map(detail => detail.message)
        return res.status(422).send(errors)
    }

    try {
        const user = await db.collection("users").findOne({username: updateTweet.username})
        if(!user){
            return res.sendStatus(401)
        }

        const result = await db.collection("tweets").updateOne({
            _id: new ObjectId(id)}, { $set: {
                tweet: updateTweet.tweet
            }}
        )

        if(result.matchedCount === 0) {
            return res.sendStatus(404)
        }

        res.sendStatus(204)

    } catch (err) {
        res.status(500).send(err)
    }
})

app.delete("/tweets/:id", async(req, res) => {
    const {id} = req.params

    try {
        const result = await db.collection("tweets").deleteOne({
            _id: new ObjectId(id)
        })

        if(result.deletedCount === 0){
            return res.sendStatus(404)
        }

        res.sendStatus(204)
    } catch (err) {
        res.status(500).send(err)
    }
})