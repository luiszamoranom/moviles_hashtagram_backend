import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();
const router = Router();

const schemaCrearHashtag = Joi.object({
    etiqueta: Joi.string().alphanum().min(3).max(10).required(),
});

const schemaActualizarHashtag = Joi.object({
    etiqueta: Joi.string().alphanum().min(3).max(10),
});

router.get('/', async (req, res) => {
    try {
        const hashtags = await prisma.hashtag.findMany();
        res.json(hashtags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los hashtags' });
    }
});

router.get('/:id', async (req, res) => {
    const hashtagId = parseInt(req.params.id);

    try {
        const hashtag = await prisma.hashtag.findUnique({ where: { id: hashtagId } });

        if (!hashtag) {
            return res.status(404).json({ error: 'Hashtag no encontrado' });
        }

        res.json(hashtag);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el hashtag' });
    }
});

router.post('/', async (req, res) => {
    const { error, value } = schemaCrearHashtag.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const hashtagExistente = await prisma.hashtag.findUnique({
            where: { etiqueta: value.etiqueta },
        });

        if (hashtagExistente) {
            return res.status(409).json({ error: 'Ya existe un hashtag con esa etiqueta' });
        }

        const nuevoHashtag = await prisma.hashtag.create({
            data: {
                etiqueta: value.etiqueta,
            },
        });

        return res.status(201).json({
            mensaje: 'Hashtag creado exitosamente',
            hashtag: nuevoHashtag,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.put('/:id', async (req, res) => {
    const hashtagId = parseInt(req.params.id);
    const { error, value } = schemaActualizarHashtag.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const hashtagExistente = await prisma.hashtag.findUnique({
            where: { etiqueta: value.etiqueta },
        });

        if (hashtagExistente && hashtagExistente.id !== hashtagId) {
            return res.status(409).json({ error: 'Ya existe un hashtag con esa etiqueta' });
        }

        const hashtagActualizado = await prisma.hashtag.update({
            where: { id: hashtagId },
            data: value,
        });

        res.json({
            mensaje: 'Hashtag actualizado exitosamente',
            hashtag: hashtagActualizado,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el hashtag' });
    }
});

router.delete('/:id', async (req, res) => {
    const hashtagId = parseInt(req.params.id);

    try {
        await prisma.hashtag.delete({ where: { id: hashtagId } });
        res.json({ mensaje: 'Hashtag eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el hashtag' });
    }
});

router.get('/obtener-fotos/:etiqueta', async (req, res) => {
    const hashtagEtiqueta = req.params.etiqueta;

    try {
        const hashtag = await prisma.hashtag.findUnique({
            where: { etiqueta: hashtagEtiqueta },
            include: {
                fotos: {
                    include: {
                        foto: {
                            include: {
                                propietario: {
                                    select: {
                                        id: true,
                                        nombreUsuario: true
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!hashtag) {
            return res.status(404).json({ error: 'No se encontraron fotos con ese hashtag' });
        }

        const fotosConHashtag = hashtag.fotos.map((hf: any) => hf.foto);

        res.json(fotosConHashtag);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las fotos' });
    }
});

router.get('/obtener-fotos-por-mas-de-un-hashtag/:etiquetas', async (req, res) => {
    const etiquetas = req.params.etiquetas.split(',');

    try {
        const fotos = await prisma.foto.findMany({
            where: {
                hashtags: {
                    some: {
                        hashtag: {
                            etiqueta: {
                                in: etiquetas,
                            },
                        },
                    },
                },
            },
            include: {
                propietario: {
                    select: {
                        nombreUsuario: true,
                    },
                },
                hashtags: {
                    select: {
                        hashtag: {
                            select: {
                                etiqueta: true,
                            },
                        },
                    },
                },
            },
        });

        res.json(fotos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las fotos' });
    }
});

export default router;