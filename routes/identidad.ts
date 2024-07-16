import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const schemaLogin = Joi.object({
  nombre_usuario: Joi.string().required().valid(),
  contrasena: Joi.string().required().valid(),
});

const router = Router();

router.post('/login', async (req, res) => {
  const { error } = schemaLogin.validate(req.body);

  if (error) {
    return res.status(400).set('x-mensaje', error.details[0].message).end();
  }

  const nombreUsuario = req.body.nombre_usuario;
  const contrasena = req.body.contrasena;

  try {
    const usuarioRegistrado = await prisma.usuario.findUnique({
      where: {
        nombreUsuario,
      },
      select: {
        id: true,
        nombreCompleto: true,
        nombreUsuario: true,
        rol: true,
        contrasena: true,
        habilitado: true,
        fotoPerfil: true,
        fotoExtension: true
      },
    });




    if (!usuarioRegistrado) {
      return res.status(404).set('x-mensaje', 'Usuario no existe.').end();
    }

    const usuarioId: number = usuarioRegistrado.id
    const nombreCompleto: string = usuarioRegistrado.nombreCompleto
    const usuarioHabilitado: boolean = usuarioRegistrado.habilitado
    const fotoPerfil = usuarioRegistrado.fotoPerfil
    const fotoExtension = usuarioRegistrado.fotoExtension


    if (!usuarioRegistrado.habilitado) {
      return res.status(401).set('x-mensaje', 'Usuario deshabilitado.').end();
    }

    const hashAlmacenado = usuarioRegistrado.contrasena;
    const contrasenaValida = await bcrypt.compare(contrasena, hashAlmacenado);

    if (!contrasenaValida) {
      return res.status(401).set('x-mensaje', 'Contrasena incorrecta.').end();
    }

    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      return res
        .status(501)
        .set('x-mensaje', 'Error, jwt secret key en el servidor no definido.')
        .end();
    }

    const usuarioRol = usuarioRegistrado.rol;
    const accessToken = jwt.sign({ usuarioRol }, secretKey, {
      expiresIn: '1h',
    });

    res
      .status(200)
      .set('x-message', 'Usuario autenticado.')
      .send({
        usuarioId,
        nombreCompleto,
        nombreUsuario,
        usuarioRol,
        fotoPerfil,
        fotoExtension,
        accessToken
      })
      .end();
  } catch (error) {
    console.error(error);
    res.status(500).set('x-mensaje', 'Error interno del servidor.').end();
  }
});

export default router;