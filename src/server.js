const express = require('express')
const bodyParser = require("body-parser");
const cors = require('cors');
const mysql = require('promise-mysql');
const app = express();
const mongoose = require('mongoose')
const { check, validationResult } = require('express-validator');



app.set('view engine', 'ejs') //sets express js views

var pool;

//create connection to sql and create pool
mysql.createPool({
    connectionLimit : 3,
    host            : "localhost",
    user            : "root",
    password        : "",
    database        : 'proj2022'
})
.then(p =>{
        pool = p
    }).catch(e =>{
        console.log("pool error:" + e)
    });


//create mongo connection
const mongoUser = "d12022"
const mongoPass = "d12022"
const mongoUri = `mongodb+srv://d12022:<d12022>@dcwa.eh5cdsz.mongodb.net/test`

//mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

mongoose.set('strictQuery', 
false);

let employeesDB = db.useDb("employeesDB")



// create a employee schema
const employeeSchema = new mongoose.Schema({
    _id: String,
    phone: String,
    email: String,
});

// create the employee model
const EmployeeModel = employeesDB.model("employees", employeeSchema);


    // parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended:false}))

// parse application/json
app.use(bodyParser.json())

app.use(cors());

app.get('/', (req, res)=>{
    // go to home page

    res.render("home", { errors: undefined});
});

//Employees sql page
app.get('/employees', (req, res) =>
{
    pool.query("select * from employee").then((d) =>
    {
        res.render("employees", { employees: d })
    }).catch((e) =>
    {
        res.redirect("/")
    })
});

//edit oage for sql
app.get('/employees/edit/:eid',
    (req, res) =>
    {
        pool.query("SELECT * FROM employee e WHERE e.eid = '" + req.params.eid + "'").then((d) =>
        {
            res.render("employee", { e: d[0], errors: undefined })
        }).catch((e) =>
        {
            res.redirect("/employees")
        })
    }
);



app.post('/employees/edit/:eid',
    (req, res) =>
    {
        const errors = validationResult(req)

        let data = {};
        data.eid = req.params.eid;
        data.ename = req.body.name;
        data.role = req.body.role;
        data.salary = req.body.salary;

        if (!errors.isEmpty())
        {
            res.render("employee", { e: data, errors: errors.errors })
        }
        else
        {
            pool.query(`UPDATE employee SET ename='${req.body.name}', role='${req.body.role}', salary='${req.body.salary}' WHERE eid = '${req.params.eid}'`).then((d) =>
            {
                res.redirect("/employees")
            }).catch((e) =>
            {
                res.redirect("/employees")
            })
        }
    }
);

//departments page
app.get('/depts', (req, res) =>
{
    pool.query("SELECT dept.did,dept.dname,loc.county,dept.budget FROM dept JOIN location AS loc ON loc.lid = dept.lid").then((d) =>
    {
        res.render("departments", { departments: d })
    }).catch((e) =>
    {
        res.redirect("/");
    })
});


//mnongo db page
app.get('/employeesMongoDB', async (req, res) =>
{
    let result = await EmployeeModel.find({})
    console.log(result);
    res.render("Mongo/employees", { employees: result });
});

//delete departments 
app.get('/depts/delete/:did', (req, res) =>
{
    pool.query(`DELETE FROM dept WHERE did = '${req.params.did}';`).then((d) =>
    {
        res.redirect("/depts")
    }).catch(() =>
    {
        res.status(400).send(
            `<div style="text-align:left;">
                <h1>Error</h1>
                <h2>${req.params.did} cant be deleted</h2>
                <a href="/depts">Home</a>
            </div>`)
    })
});


app.listen(3000, ()=>{
    console.log("Listening on port 3000")
});

