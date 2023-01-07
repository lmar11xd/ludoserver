const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const io = require('socket.io')
const cors = require('cors')

const User = require('./models/user')

dotenv.config();

mongoose.Promise = global.Promise;
mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.MONGO_URL, { useNewUrlParser: true })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => {
    console.log(err);
  });

const app = express()
app.use(cors);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log('Servidor Ludo activo en el puerto: ', port)
});

let socketIo = new io.Server(server);
socketIo.on('connection', (socket) => {
    console.log("Conectado al socket", socket.id);

    socket.on('login', async ({email, password}) => {
        User.findOne({email, password}, (err, user) => {
            if (err) {
                socketIo.to(socket.id).emit("errorMessage", "Error al buscar usuario.");
            } else {
                if (user) {
                    socketIo.to(socket.id).emit("loginSuccess", user);
                } else {
                    socketIo.to(socket.id).emit("errorMessage", "Usuario no encontrado.");
                }
            }
        })
    });

    socket.on('register', async ({name, email, password}) => {
        User.findOne({email}, async (err, user) => {
            if (err) {
                socketIo.to(socket.id).emit("errorMessage", "Error al registrar usuario.");
            } else {
                if (user) {
                    socketIo.to(socket.id).emit("errorMessage", "El usuario ya está registrado.");
                } else {
                    let user = new User({name, email, password});
                    user = await user.save();
                    const userId = user._id.toString();
                    socketIo.to(socket.id).emit('registerSuccess', user);
                }
            }
        })
    });

    socket.on('createRoom', async ({nickname}) => {
        console.log(nickname);
    })
});