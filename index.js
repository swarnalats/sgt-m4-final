const express = require('express');
const PORT = process.env.PORT || 9000;
const db = require('./db');

const app = express();

 app.get('/api/test',async (req,res) => {
    //res.send("TESTing successful");
    const [results] = await db.query('SELECT * FROM grades');
    res.send(results);
});

app.listen(PORT,() => {
    console.log('Server listening at localhost:' + PORT);
} )