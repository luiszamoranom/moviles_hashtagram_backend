

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre_completo varchar(20) NOT NULL,
    nombre_usuario varchar(20) NOT NULL,
    descripcion varchar(100),
    email varchar(50) NOT NULL,
    contrasena varchar(200) NOT NULL,
    foto_perfil TEXT,
    foto_extension varchar(4),
    habilitado BOOLEAN DEFAULT TRUE,
    rol varchar(50) DEFAULT 'usuario',
    create_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    UNIQUE(nombre_usuario),
    UNIQUE(email)
);