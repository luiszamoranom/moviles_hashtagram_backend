// @ts-ignore
import express from 'express';
// @ts-ignore
import cors from 'cors'

import usuarioRoute from './routes/usuarios';
import identidadRoute from './routes/identidad'
import hashtagRoute from './routes/hashtag'
import fotoRoute from './routes/foto'
import usuarioviofotoRoute from "./routes/usuarioviofoto";
import meGustaRoute from "./routes/megusta";

export const app = express();
const PORT = 9999
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // incluir cookies, credenciales y certificados en el CORS
};
app.use(cors(corsOptions));
app.use(express.json({limit: '100mb'}));

app.use("/usuario", usuarioRoute);
app.use("/identidad", identidadRoute);
app.use("/hashtag", hashtagRoute);
app.use("/foto", fotoRoute);
app.use("/usuarioviofoto", usuarioviofotoRoute);
app.use("/me-gusta", meGustaRoute);


app.get("/ping", async (req, res) => {
    res.send( {data: "pong"})
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});