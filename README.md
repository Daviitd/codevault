# CodeVault

## 1. Información General

- **Nombre del proyecto:** CodeVault  
- **Nombre del estudiante:** Daniel David Gomez Riobo 
- **Fecha:** Febrero 2026   

---

## 2. Descripción del Proyecto

CodeVault es una plataforma web que permite guardar fragmentos de código junto con notas explicativas.

Los usuarios pueden registrarse o iniciar sesión con correo electrónico o con Google.  
Una vez dentro, pueden almacenar códigos organizados y añadir notas al lado de cada fragmento.

Está pensado para estudiantes y desarrolladores que necesitan guardar y organizar código de forma práctica.

---

## 3. Tecnologías Utilizadas

- React
- Vite
- Node.js
- TypeScript
- OAuth con Google
- Git y GitHub
- PNPM

---

## 4. Estructura del Proyecto

/codevault
├── client/
├── server/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md


- **client/** → Parte visual (frontend)
- **server/** → Lógica del backend
- **package.json** → Dependencias del proyecto
- **vite.config.ts** → Configuración del entorno

---

## 5. Funcionalidades

1. Registro de usuarios
2. Inicio de sesión con correo o Google
3. Guardar fragmentos de código
4. Añadir notas a cada código
5. Visualización organizada de los códigos

---

## 6. Capturas de Pantalla

![Login](login.png) Login
![Dashboard](dashboard.png) Dashboard
![Código con notas](commit.png) Código con notas

---

## 7. Cómo Ejecutar el Proyecto

1. Clonar el repositorio:
   git clone https://github.com/Daviitd/codevault.git

2. Entrar en la carpeta:
   cd codevault

3. Instalar dependencias:
   pnpm install

4. Ejecutar el proyecto:
   pnpm dev
   
5. Abrir en el navegador:
   http://localhost:3000
   
---

## 8. Mejoras Futuras

- Permitir editar y eliminar códigos
- Mejorar la interfaz gráfica
- Agregar base de datos persistente
- Implementar sistema de búsqueda avanzada

---

## 9. Reflexión Personal

Durante el desarrollo aprendí a integrar autenticación con Google, organizar un proyecto con frontend y backend y documentar profesionalmente utilizando Markdown.
