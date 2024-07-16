import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

const schemaLogin = Joi.object({
    usuarioId: Joi.number().required().valid(),
    fotoId: Joi.number().required().valid(),
});

const router = Router();

router.post('/ocultar-foto', async (req, res) => {
    const { error } = schemaLogin.validate(req.body);

    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }

    const usuarioId: number = req.body.usuarioId;
    const fotoId: number = req.body.fotoId;

    const existe = await prisma.usuarioVioFoto.findUnique({
        where: {
            usuarioId_fotoId: {
                usuarioId,
                fotoId,
            },
        }
    })


    try {
       if(existe){
           const actualizado = await prisma.usuarioVioFoto.update({
               where: {
                   usuarioId_fotoId: {
                       usuarioId,
                       fotoId,
                   },
               },
               data: {
                   habilitado: true,
               },
           });

           if(!actualizado){
               return res.status(404).send("Asociación usuario_foto no encontrada").end();
           }

           res.status(200).send("Se ocultará la foto para el usuario");
       }
       return res.status(404).send("No existe dicha asociación de usuario con foto para ocultarla");
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al ocultar la foto');
    }
});

export default router;