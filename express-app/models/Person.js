import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    //Nuevo objeto incrustado en el base
    userOrder: { type:Object, default: {} }
    //El minimize hace que no elimine los objetos vacíos
}, { timestamps: true, minimize:false }); //Esto es un nuebo objeto que añade dos campos

export const Person = mongoose.model('Person', personSchema);