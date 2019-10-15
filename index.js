const express = require('express');
const PORT = process.env.PORT || 9000;
const db = require('./db');
const statusError = require('./helpers/status_error');
const defaultErrorHandler = require('./middleware/default_error_handler');

global.StatusError = statusError; 

const app = express();
app.use(express.json());
//app.use(express.urlencoded({extended:false}));

 app.get('/api/test',async (req,res) => {
    //res.send("TESTing successful");
    const [results] = await db.query('SELECT * FROM grades');
    res.send(results);
});

app.get('/api/grades', async(req,res) => {
    try{
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
}catch(err){
    console.log("error"); 
}
});   

app.post('/api/grades', async(req,res,next) => {
    try { 
    const {course = null, grade = null, name = null} = req.body; 
    console.log ("course",course,grade,name);
    if( !course || !grade || !name ) {
        res.status(422).send(" Please provide all these data: course,grade, name in the body");
    }
    else {
        if( grade < 0 || grade > 100){
             throw new StatusError(422,"The grade needs to anywhere from 0 to 100.");
        }
        else {
            console.log("INSIDE ELSE");
            const [results] = await db.execute('INSERT INTO grades (pid, course, grade, name) VALUES(?,?,?,?)',["gfghfgghhff",course,grade,name]);
            console.log("Added Record:", results.insertId);
            if(results.affectedRows > 0 ){       
                console.log("INSIDE RESULTS AFFECTED",results.insertId);         
                const [row] = await db.execute('SELECT * FROM grades WHERE id=?',[results.insertId]);     
                console.log("Grade added:",row);
                const r = row.map(rc => {                     
                     res.send({
                            "message":"New Student grade record created successfully",
                            "record": {
                                "pid": rc.pid,
                                "course":rc.course,
                                 "grade":rc.grade,
                                "name":rc.name,
                                "lastUpdated":rc.updated
                            } 
                    });
                });
    }
}
        return;
    } 
    } catch(err){
    next(err);
}

}); 

app.use(defaultErrorHandler);

app.listen(PORT,() => {
    console.log('Server listening at localhost:' + PORT);
} )