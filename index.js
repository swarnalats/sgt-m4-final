const express = require('express');
const PORT = process.env.PORT || 9000;
const db = require('./db');
const statusError = require('./helpers/status_error');
const defaultErrorHandler = require('./middleware/default_error_handler');

global.StatusError = statusError; 

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:false}));

//Feature Set-3
app.get('/api/test',async (req,res) => {
    const [results] = await db.query('SELECT * FROM grades');
    res.send(results);
});

//Feature Set-4
app.get('/api/grades', async(req,res,next) => {
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
        next(err); 
    }
});   

//Feature Set-5
app.post('/api/grades', async(req,res,next) => {
    try { 
    const {course = null, grade = null, name = null} = req.body; 
    const errors = [];
    if( !course){
        errors.push("No course received");
    }
    if(!grade){
        errors.push("No grade received");
    }
    if(!name){
        errors.push("No name received");
    }
    if(errors.length > 0){
        throw new StatusError(422, returnErrorMessage(422, errors));
    }
    
    if( grade < 0 || grade > 100){
            throw new StatusError(422, returnErrorMessage(422,"Course grade must be a number between 0 and 100 inclusive. 205 is invalid."));
    }
    else {
            const [results] = await db.execute('INSERT INTO grades (pid, course, grade, name) VALUES(UUID(),?,?,?)',[course,grade,name]);
            
            if(results.affectedRows > 0 ){     
                const [studentRecord] = await db.execute('SELECT * FROM grades WHERE id=?',[results.insertId]);     
                const r = studentRecord.map(sr => {                     
                     res.send({
                            "message":"New Student grade record created successfully",
                            "record": {
                                "pid": sr.pid,
                                "course":sr.course,
                                 "grade":sr.grade,
                                "name":sr.name,
                                "lastUpdated":sr.updated
                            } 
                    });
                });
                }
    }
    return;
    } catch(err){
        next(err);
}
}); 


//Feature Set-6
app.patch('/api/grades/:record_pid', async(req,res,next)=> {
    try{
        
        const {body, params:{record_pid = null}} = req;
        const whiteList = ['course','grade','name'];
        const updateValues = [];
        let sql = 'UPDATE grades SET';
        let didUpdate = false;
        
        whiteList.forEach(col => {
            let update = body[col];
            
            if(update <1 || update > 100){
                throw new StatusError(422, returnErrorMessage(422,'Course grade must be a number between 0 and 100 inclusive. 125 is invalid.' ));
            }
            if(update !== undefined){
                didUpdate = true;
                if(updateValues.length){
                    sql += ',';                    
                }
                sql += ' ';
                sql += `${col}=?`;
                updateValues.push(update);
            }
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
        throw new statusError(404, returnErrorMessage(404,`No record found with ID:${record_pid}` ));
    }
    else {
        throw new StatusError(400, returnErrorMessage(400,"No valid fields received to update"));
    }
    }catch(err){       
        next(err);
    }
});

//Feature Set-7
app.delete('/api/grades/:record_pid',async(req,res,next) => {
    try{

        const { record_pid } = req.params;
        
        if(!record_pid){
            throw new StatusError(422, returnErrorMessage(422,"Invalid student id received")); 
        }

        const [result] = await db.execute('DELETE FROM grades WHERE pid=?',[record_pid]);

        let message = `Unable to delete, no student found with PID: ${record_pid}`;

        if(result.affectedRows){
            message = `Successfully deleted the student with PID: ${record_pid}`;            
        }
        else {
            throw new StatusError(404, returnErrorMessage(404,`No record found with ID:${record_pid}`));
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
})

function returnErrorMessage(code,message){
    const errors = [message];
    const errorMessage = {
        "code":code,
         errors   
    }
    return errorMessage;
}