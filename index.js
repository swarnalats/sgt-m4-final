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

app.patch('/api/grades/:record_pid', async(req,res,next)=> {
    try{
        const {body, params:{record_pid}} = req;
        const whiteList = ['course','grade','name'];
        const updateValues = [];
        let sql = 'UPDATE grades SET';
        let didUpdate = false;
        
        if(!record_pid){
            throw new StatusError(422,'Invalid student ID received');
        }

        whiteList.forEach(col => {
            let update = body[col];
            
            if(update <1 || update > 100){
                throw new StatusError(422, 'Please enter a grade between 1 and 100'); 
            }

            if(update !== undefined){
                didUpdate = true;
                if(updateValues.length){
                    sql += ',';                    
                }
            }
            sql += ' ';
            sql += `${col}=?`;
            updateValues.push(update);
        });
    
    if(didUpdate){
        sql += ' WHERE pid=?';
        updateValues.push(record_pid);

        const [result] = await db.execute(sql, updateValues);

        if(result.affectedRows){
            status = 200;
            const [[student]] = await db.execute(`SELECT id, course, grade, name FROM grades WHERE pid=?`,[record_pid]);
            
            return res.send({
                message:`Successfully updated the student with ${student.id}`,
                student:student
            })
        }
        throw new StatusError(404, 'Unable to update the student info. No student found with ID:${id}');
    }
    }   catch(err){       
            next(err);
        }
});

app.delete('/api/grades/:record_pid',async(req,res,next) => {
    try{

        const { record_pid } = req.params;
        console.log("Record ID",record_pid);
        if(!record_pid){
            throw new StatusError(422, "Invalid student id received"); 
        }

        const [result] = await db.execute('DELETE FROM grades WHERE pid=?',[record_pid]);

        let message = `Unable to delete, no student found with PID: ${record_pid}`;

        if(result.affectedRows){
            message = `Successfully deleted the student with PID: ${record_pid}`;            
        }
        else {
            throw new StatusError(404, `No student found with ID:${record_pid}`);
        }
        res.send({
            message
        });


        }catch(err){
        next(err);
    }
    });

app.use(defaultErrorHandler);

app.listen(PORT,() => {
    console.log('Server listening at localhost:' + PORT);
} )