import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import WebSocket from 'ws';

const prisma = new PrismaClient();

const schemaLogin = Joi.object({
    interactuadorId: Joi.number().required().valid(),
    fotoId: Joi.number().required().valid(),
});

const router = Router();

const ws = new WebSocket('ws://34.41.29.202:4444');

let wsConectado = false; 

ws.on('open', () => {
    console.log('Conexión WebSocket establecida');
    wsConectado = true; 
});

ws.on('error', (error) => {
    console.error('Error en la conexión WebSocket:', error);
});


function enviarMensajeWebSocket(mensaje: any) {
    if (wsConectado) {
      ws.send(String(mensaje));
    } else {
      console.error('No se pudo enviar el mensaje, la conexión WebSocket no está abierta');
    }
}
router.post('/registrar', async (req, res) => {
    const {error} = schemaLogin.validate(req.body);

    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }

    const interactuadorId: number = req.body.interactuadorId;
    const fotoId: number = req.body.fotoId;

    const existe = await prisma.meGusta.findUnique({
        where: {
            interactuadorId_fotoId: {
                interactuadorId,
                fotoId
            },
        }
    })

    try {
        if(!existe){
            const actualizado = await prisma.meGusta.create({
                data: {
                    interactuadorId,
                    fotoId
                },
            });

            const existeFoto = await prisma.foto.findFirst({
                where: {
                    id: fotoId
                }
            })

            const interactuador = await prisma.usuario.findFirst({
                select: {
                    nombreUsuario: true
                },
                where: {
                    id: interactuadorId
                }
            }
                
            )

            if(existeFoto){
                await prisma.foto.update({
                    where: {
                        id: fotoId
                    },
                    data: {
                        cantidad: existeFoto.cantidad+1
                    }
                })

                enviarMensajeWebSocket(existeFoto.propietarioId);
            }


            return res.status(200).send("Me gusta registrado");
        }
        return res.status(400).send("Existe dicha asociacion de me gusta ya");
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error al dar me gusta a la foto');
    }
});

router.delete('/eliminar', async (req, res) => {
    const {error} = schemaLogin.validate(req.query);

    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }

    const interactuadorId = req.query.interactuadorId ? parseInt(req.query.interactuadorId as string) : undefined;
    const fotoId = req.query.fotoId ? parseInt(req.query.fotoId as string) : undefined;

    if (interactuadorId === undefined || fotoId === undefined) {
        return res.status(400).send('Parametros undefined');
      }

    const existe = await prisma.meGusta.findUnique({
        where: {
            interactuadorId_fotoId: {
                interactuadorId,
                fotoId
            },
        }
    })

    try {
        if(existe){
            const eliminado = await prisma.meGusta.delete({
                where: {
                    interactuadorId_fotoId: {
                        interactuadorId,
                        fotoId
                    },
                }
            });

            const existeFoto = await prisma.foto.findFirst({
                where: {
                    id: fotoId
                }
            })

            if(existeFoto){
                await prisma.foto.update({
                    where: {
                        id: fotoId
                    },
                    data: {
                        cantidad: existeFoto.cantidad-1
                    }
                })

                enviarMensajeWebSocket(existeFoto.propietarioId);
            }

            return res.status(200).send("Me gusta eliminado");
        }
        return res.status(400).send("Error al eliminar me gusta");
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error al dar me gusta a la foto');
    }
});

router.get('/me-gusta-que-me-han-dado/:id', async (req, res) => {
    const usuarioId = parseInt(req.params.id);

    const meGustaQueMeHanDado = await prisma.meGusta.findMany({
        include: {
            foto: {
                include: {
                    propietario: {
                        select: {
                            id: true,
                        }
                    }
                }
            },
            interactuador: {
                select: {
                    id: true,
                    nombreUsuario: true,
                    fotoPerfil: true,
                    fotoExtension: true
                }
            }
        },
        where: {
            foto: {
                propietarioId: usuarioId
            },
            ocultado: false
        },
        orderBy: {
            createAt: 'desc'
        }
        
    })

    if(meGustaQueMeHanDado.length == 0){
        return res.status(404).send("Sin me gustas")
    }
    return res.status(200).send(meGustaQueMeHanDado)
})

router.get('/cantidad-de-me-gusta-no-ocultos/:id', async (req, res) => {
    const usuarioId = parseInt(req.params.id);

    const meGustaQueMeHanDado = await prisma.meGusta.findMany({
        include: {
            foto: {
                include: {
                    propietario: {
                        select: {
                            id: true,
                        }
                    }
                }
            }
        },
        where: {
            foto: {
                propietarioId: usuarioId
            },
            ocultado: false
        },
    })

    const cantMg = meGustaQueMeHanDado.length
    console.log(cantMg)
    return res.status(200).send({
        cantidadMeGusta: cantMg
    })
})

router.patch('/ocultar-me-gusta/:id', async (req, res) => {
    const meGustaId = parseInt(req.params.id);

    try {
        const meGustaQueMeHanDado = await prisma.meGusta.update({
            data: {
                ocultado: true
            },
            where: {
                id: meGustaId
            }
        })

        return res.status(200).send("Me gusta ocultado");
    } catch(e) {
        return res.status(400).send(e)
    }
})

router.get('/saber-si-usuario-dio-like-a-una-foto', async (req, res) => {
    const {error} = schemaLogin.validate(req.query);

    if (error) {
        return res.status(400).set('x-mensaje', error.details[0].message).end();
    }

    const interactuadorId = req.query.interactuadorId ? parseInt(req.query.interactuadorId as string) : undefined;
    const fotoId = req.query.fotoId ? parseInt(req.query.fotoId as string) : undefined;

    const usuarioDioLike = await prisma.meGusta.findFirst({
        where: {
            interactuadorId: interactuadorId,
            fotoId: fotoId
        }
    })

    if(!usuarioDioLike){
        return res.status(400).send("usuario no dió like a la foto")
    }

    return res.status(200).send("usuario dió like a la foto") 

})

export default router;