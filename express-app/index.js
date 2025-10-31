/////////////////Imports  & config///////////////////
/*npm start*/
/*nodemon module*/
import express from 'express'
import router from './route.js'
import multer from 'multer';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './config/multer.js';
import { connectDB } from './config/db.js';
import { Person } from './models/Person.js';

const app = express();
const PORT = 3000;
const users = [];

/*NOTA: todos los .use son middlewares y se ejecutan en orden*/

/////////////////Database connection///////////////////

await connectDB();

//////////////////Multer & storage/////////////
//npm i multer

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5 //5MB
    }
});

app.use(express.urlencoded({ extended: true }));
//app.use(upload.array());
app.use(upload.single('image'));

/////////////Cookies/////////////
//npm i cookie-parser

app.use(cookieParser());

app.get('/fetch', (req, res) => {
    console.log(req.cookies);
    res.send('Hola API fetch');
});

app.get('/remove-cookie', (req, res) => {
    res.clearCookie('name');
    res.send('Cookie borrada');
});


////////////Sessions/////////////
//npm i express-session

app.use(session({  
    secret: 'sample-secret',
    //No guarda la sesión si no ha cambiado durante la petición.
    resave: false,
    //Guarda sesiones nuevas incluso si no tienen datos modificados.
    saveUninitialized: true,
}));

app.get('/session', (req, res) => {
    if (req.session.page_views) {
        req.session.page_views++;
        res.send(`Has visitado esta página: ${req.session.page_views} veces`);
    } else {
        //Se crea una nueva sesión
        req.session.page_views = 1;
        res.send('Bienvenido! Esta es tu primera visita.');
    }
});

app.get('/remove-session', (req, res) => {
    req.session.destroy();
    res.send('Sesión eliminada');
}); 


///////////////JWT////////////////////
//npm i jsonwebtoken
//npm i bcryptjs


////////////////Form/////////////////

app.post('/form', (req, res) => {
    console.log(req.body);
    console.log(req.file);
    res.send('From received');
});

////////////////Middleware (basic)///////////////////

app.use((req, res,next) => {
    console.log('Start');
    next();
    res.on('finish', () => {
        console.log('End');
    });

});

app.use(express.static('public'));


////////////////Error handling middleware///////////////////

app.get('/error', (req, res) => {
    throw new Error('ROTO');
});

/*
app.use((err, req, res, next) => {
    console.error(err.message);
    res.send('Something broke!');
});
*/

// Error síncrono
app.get('/sync-error', (req, res, next) => {
    try {   
        throw new Error('Algo ha ido mal :(');
    } catch (error) {
        //Mandamos el error al middleware especializado
        next(error);
    }
});

// Error asíncrono
app.get('/async-error', async (req, res, next) => {
    try {  
        //Espera a que la promesa rechace o resuelva
        await Promise.reject('Error asíncrono...');
    } catch (error) {
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error(err.message);
    console.log(err.stack);
    res.status(500).json({message:err.message});
});

//Captura errores no manejados
process.on("uncaughtException",(err)=>{
    console.error("Uncaught Exception:",err.message);
    process.exit(1);
});


////////////////Routes///////////////////

app.use('/user',router)
app.use(express.json());

//Crear persona
app.post('/person', async (req, res) => {
    try {
        const {email,name,age} = req.body;
        const newPerson = new Person({
            name,
            age,
            email
        })
        //Guardar en db
        await newPerson.save();(newPerson);
        console.log(newPerson);
        res.send(`Persona ${name} de edad ${age} creada!`);
    } catch (error) {
        res.send(error.message);
    }
});

//Actualizar persona
app.put('/person', async (req, res) => {
    const { id } = req.body;

    const personData = await Person.findByIdAndUpdate(id, { age: '34' }, { new: true });
    console.log(personData);
    res.send('Persona updated!');
});

//Borrar persona
app.delete('/person/:id', async (req, res) => {
    const { id } = req.params;
    await Person.findByIdAndDelete(id);
    res.send('Persona borrada!');
});

//Registrar usuario
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    //Encriptamos contraseña (10 rondas) -> bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ 
        username, 
        password:hashedPassword 
    });
    res.send(`Usuario ${username} registrado!`);
});

//Login usuario
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || await bcrypt.compare(password, user.password)) {
        return res.send("Credenciales inválidas!");
    }
    //Si es correcto, generamos token (payload debe ser un JSON (objeto))
    const token = jwt.sign({username},'test#secret');
    res.json({token});
    req.session.user = user;
    res.send("Login exitoso!");
});

//Dashboard (protegido)
app.get('/dashboard', (req, res) => {
    /*
    if (!req.session.user) {
        return res.send("No autoriazado");
    }
    res.send(`Bienvenido al dashboard, ${req.session.user.username}!`);
    */
   try {
    const token = req.headers('Authorization');
    const decodedToken = jwt.verify(token, 'test#secret');
    //Antes hemos firmado el token con el username
    if (decodedToken.username) {
            res.send(`Bienvenido al dashboard, ${decodedToken.username}!`);
    }
    else {
            res.send("No estás autorizado");
    }
    } catch (error) {
        res.send("No estás autorizado");
    }
});

/////////////////API///////////////////

app.get('/api/products', (req, res) => {
    const products = [
        { id: 1, name: 'Laptop', price: 1000 },
        { id: 2, name: 'Mobile', price: 500 },
    ]
    res.status(200).json({products});
});

app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const products = [
        { id: 1, name: 'Laptop', price: 1000 },
        { id: 2, name: 'Mobile', price: 500 },
    ]

    const product = products.find(p => p.id === Number(req.params.id));
    if (!product) {
        return res.status(404).json({message: 'Producto no encontrado'});
    }

    res.status(404).json({product});
});

//Crear producto
app.post('/api/products', (req, res) => {
    const newProduct = req.body;
    newProduct.id = Date.now();
    res.status(201).json(newProduct);
});

/////////////////Home///////////////////

app.get('/', (req, res) => {
    //res.cookie('name','express-app'/*, {maxAge : 3600000}*/);
    res.send('Hello, guapo!');
});

/////////////////Server///////////////////

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/ping', (req, res) => {
    console.log('Ping recibido');
    res.send('pong');
});
  