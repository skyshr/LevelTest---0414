var express = require('express');
var app = express();
var cookie = require('cookie');
const cors = require("cors"); 
const axios = require("axios");

app.use(cors());

app.get('/', (req, res) => {
    var cookies = {}
    axios.get('http://localhost:3000/getCookie').then((res) => {
        // console.log(res.data);
        console.log(req.headers.cookie);
        cookies = cookie.parse(req.headers.cookie);
        console.log(cookies.yummy_cookie);
    }).then(() => {
        console.log(cookies);
        res.send(cookies);
    })
})


app.listen(4000, () => {console.log('Server listening at port 4000...')});