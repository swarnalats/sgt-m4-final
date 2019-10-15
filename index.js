const express = require('express');
const PORT = process.env.PORT || 9000;
const db = require('./db');

const app = express();

 app.get('/api/test',async (req,res) => {
    //res.send("TESTing successful");
    const [results] = await db.query('SELECT * FROM grades');
    res.send(results);
});

app.get('/api/grades', async(req,res) => {
    const [results] = await db.query('SELECT pid,course, grade,name,updated from grades');

    const grades = results.map(g => {
        const studentGrade = {
            "pid":g.pid,
            "course":g.course,
            "grade":g.grade,
            "name":g.name,
            "lastUpdated":g.updated
        }
        return studentGrade;
    });
    res.send({
        "records": 
            grades
        
    });
});    

app.listen(PORT,() => {
    console.log('Server listening at localhost:' + PORT);
} )