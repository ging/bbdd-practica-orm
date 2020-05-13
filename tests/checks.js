/* eslint-disable no-invalid-this*/
/* eslint-disable no-undef*/
// IMPORTS
const path = require("path");
const util = require('util');
const Utils = require("./testutils");
const exec = util.promisify(require('child_process').exec);

const node_modules = path.resolve(path.join(__dirname, "../", "node_modules"));
var sequelize;

let Controller;
let Hospital;
let Patient;
let Doctor;
const models_lib = require('../models/models.js');

const T_TEST = 2 * 60

// CRITICAL ERRORS
let error_critical = null;

// TESTS
describe("P5_ORM_BBDD", function () {

    this.timeout(T_TEST * 1000);

    before('Create and populate testing database', async function() {
        const create_database ='mysql -u ' +process.env.MYSQL_USER +' -p' +process.env.MYSQL_PASS +" -e 'CREATE DATABASE IF NOT EXISTS orm_bbdd_test;'";
        const load_data ='mysql -u ' +process.env.MYSQL_USER +' -p' +process.env.MYSQL_PASS +' orm_bbdd_test < tests/backup.sql';

        try {
            await exec(create_database)
            let { stdout, stderr } = await exec(load_data)
            console.log(stderr)
            console.log(stdout)
            models = await models_lib.configure_db('orm_bbdd_test');
            Hospital = models.Hospital;
            Patient = models.Patient;
            Doctor = models.Doctor;
            Controller = require('../controllers/controller')(models);
            console.log('Base de datos de testing creada satisfactoriamente.');
        } catch (error) {
            console.error('Unable to create the database.');
            error_critical = 'Unable to create the database. Está arrancada la BD? Has configurado las variables de entorno con el user y pass de MySQL? Has importado la base de datos employees?';
            if (!process.env.MYSQL_USER || !process.env.MYSQL_PASS) {
                console.error('Has configurado las variables de entorno con el user y pass de MySQL?');
            };
        }
    });

    it("(Precheck) Comprobando que las dependencias están instaladas...", async function () {

        this.score = 0;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {


            this.msg_ok = `Encontrado el directorio '${node_modules}'`;
            this.msg_err = `No se encontró el directorio '${node_modules}'`;
            var fileexists;
            try {
                fileexists = await Utils.checkFileExists(node_modules);
                if (!fileexists) {
                    error_critical = this.msg_err;
                }            
            } catch (err) { error_critical = err;}

            fileexists.should.be.equal(true);
        }
    });

    it("(Precheck): Comprobando que se ha cargado la base de datos...", async function () {
        this.name = "";
        this.score = 0;
        this.msg_ok = 'Encontrado base de datos';
        this.msg_err = 'No se encontró la base de datos';

        try {
            let hospitals_count = await Hospital.count();
            let patient_count = await Patient.count();
            let doctor_count = await Doctor.count();

            should.equal(hospitals_count, 5)
            should.equal(patient_count, 7)
            should.equal(doctor_count, 7)          
        } catch (err) { error_critical = err }
    });

    it("(1): Comprobando que list_hospitals devuelve los hospitales correctamente...", async function () {
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `list_hospitals devuelve los hospitales correctamente`;
            this.msg_err = `list_hospitals no devuelve los hospitales correctamente`;
            
            let hospitals;
            try {    
                hospitals = await Controller.list_hospitals();
            } catch (err) { error_critical = err }

            should.equal(hospitals.length, 5)
            should.equal(typeof hospitals[0], 'object');
        }
    });

    it("(2): Comprobando que filterHospitalsByCity devuelve los hospitales correctamente...", async function () {
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `list_hospitals devuelve los hospitales correctamente`;
            this.msg_err = `list_hospitals no devuelve los hospitales correctamente`;
            
            let hospitals1;
            let hospitals2;

            try {
                hospitals1 = await Controller.filterHospitalsByCity('Madrid');
                hospitals2 = await Controller.filterHospitalsByCity('Barcelona');
            } catch (err) { error_critical = err }

            should.equal(hospitals1.length, 2);
            should.equal(hospitals2.length, 1);
        }
    });

    it("(3): Comprobando que list_hospital_patients devuelve los pacientes correctamente...", async function () {
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `list_hospital_patients devuelve los pacientes correctamente`;
            this.msg_err = `list_hospital_patients no devuelve los pacientes correctamente`;
            
            let patients1;
            let patients2;

            try {
                patients1 = await Controller.list_hospital_patients('db6da10f-4ec4-468a-ad46-36a407480fa7');
                patients2 = await Controller.list_hospital_patients('d2dc1154-1329-4e56-a5c3-8e88b63f3c4a');
            } catch (err) { error_critical = err }

            should.equal(patients1[0].id, '623f492d-a42c-481e-bf21-c0acbc1b90f8');
            should.equal(patients2[0].id, 'a1965d07-caae-407d-8df1-060e88015932');
        }
    });

    it("(4): Comprobando que read devuelve los datos de pacientes correctamente...", async function () {
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `read devuelve los datos del paciente correctamente`;
            this.msg_err = `read no devuelve los datos del paciente correctamente`;
            
            let patient1;
            let patient2;
            try {
                patient1 = await Controller.read('8ec8c43b-f7e1-43e4-b70f-6d5a9799a86a');
                patient2 = await Controller.read('923ec756-87b7-4743-808b-795a04b6dd21');
            } catch (err) { error_critical = err }

            should.equal(patient1.name, 'Carlos');
            should.equal(patient2.name, 'Diana');
        }
    });

    it("(5): Comprobando que create crea un paciente correctamente...", async function () {
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `create crea un paciente correctamente`;
            this.msg_err = `create no crea un paciente correctamente`;
            
            let patient1;
            let patient2;

            try {
                patient1 = await Controller.create('b04fde75-59d8-457f-82b9-c25f2c64abfc', 'Cristina', 'Sainz', '7843573');
                patient2 = await Patient.findOne({where: { dni: '7843573'}})
            } catch (err) { error_critical = err }

            should.equal(patient1.name, patient2.name);
            should.equal(patient1.hospital_id, patient2.hospital_id);
        }
    });

    it("(6): Comprobando que update actualiza un paciente correctamente...", async function () {
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `update actualiza un paciente correctamente`;
            this.msg_err = `update no actualiza un paciente correctamente`;
            
            let patient1;
            let patient2;
            try {
                patient1 = await Controller.update('3a268172-6c5c-4d9b-8964-8b9a1e531af5', 'Pedro', 'Sanchez', '555555');
                patient2 = await Patient.findByPk('3a268172-6c5c-4d9b-8964-8b9a1e531af5');
            } catch (err) { error_critical = err }

            should.equal(patient2.name, 'Pedro');
            should.equal(patient2.surname, 'Sanchez');
        }
    });

    it("(7): Comprobando que delete borrar un paciente correctamente...", async function () {
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `delete borra un paciente correctamente`;
            this.msg_err = `delete no borra un paciente correctamente`;
            
            let patientDeleted;
            try {
                await Controller.delete('088d58e2-7691-47b6-a322-eeffcadc9054');
                patientDeleted = await Patient.findByPk('088d58e2-7691-47b6-a322-eeffcadc9054');
            } catch (err) { error_critical = err }

            should.equal(patientDeleted, null);
        }
    });

    it("(8): Comprobando que assignDoctor asignar un medico correctamente...", async function () {
        this.score = 1.5;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `Asigna un medico correctamente`;
            this.msg_err = `No asigna un medico correctamente`;
            
            let patient;
            try {
                await Controller.assignDoctor('a1965d07-caae-407d-8df1-060e88015932','8f5cb256-7f39-4293-817a-b5e50a0e0062');
                patient = await Patient.findByPk('a1965d07-caae-407d-8df1-060e88015932');
            } catch (err) { error_critical = err }

            let doctors;
            try {
                doctors = await patient.getDoctors()
            } catch (err) { error_critical = err }
            
            should.equal(doctors[0].id, '8f5cb256-7f39-4293-817a-b5e50a0e0062');
        }
    });


    it("(8): Comprobando que showPatientDoctors muestra medicos correctamente...", async function () {
        this.score = 1.5;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `Muestra medicos correctamente`;
            this.msg_err = `No muestra medicos correctamente`;
            
            let doctors;
            try {
                doctors = await Controller.showPatientDoctors('3a268172-6c5c-4d9b-8964-8b9a1e531af5');
            } catch (err) { error_critical = err }

            should.equal(doctors.length, 2);
        }
    });


    after('Delete testing database', async function() {
        const drop_database ='mysql -u ' +process.env.MYSQL_USER +' -p' +process.env.MYSQL_PASS +" -e 'DROP DATABASE orm_bbdd_test;'";

        try {
            await exec(drop_database)
            console.log('Base de datos de testing borrada satisfactoriamente.');
        } catch (error) {
            console.error('Unable to delete the database.');
            error_critical = 'Unable to delete the database. Está arrancada la BD? Has configurado las variables de entorno con el user y pass de MySQL? Has importado la base de datos employees?';
            if (!process.env.MYSQL_USER || !process.env.MYSQL_PASS) {
                console.error('Has configurado las variables de entorno con el user y pass de MySQL?');
            };
        }
    });
});