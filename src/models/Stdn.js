import {Schema, model} from 'mongoose';

//esquema grado, el primer atributo es grado y grupo y el segundo es un array con los estudiantes

const studentsSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        subject_grade: {
            type: Number,
            required: false
        },
        status:{
            type: Boolean,
            required: true,
            default: false
        }
    },{
        timestamps: true,
        versionKey: false
    }
);

export default model('Stdn', studentsSchema);
