import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

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

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Servidor rodando liso na porta ${port}`)
})