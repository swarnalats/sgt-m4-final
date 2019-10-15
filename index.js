const express = require('express');
const PORT = process.env.PORT || 9000;

const app = express();

app.get('/api/test',(req,res) => {
    res.send("TESTing successful");
});

app.listen(PORT,() => {
    console.log('Server listening at localhost:' + PORT);
} )