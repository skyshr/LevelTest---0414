const express = require('express');
const app = express();
const cors = require("cors"); 
const cookieParser = require("cookie-parser");

app.use(cors());
app.use(cookieParser());

app.get('/getCookie', (req, res) => {
    res.writeHead(200, {
        'Set-Cookie':['yummy_cookie=choco', 'tasty_cookie=strawberry']         
    });
    res.end("{Token: true}");

    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000')
    // res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS,DELETE')
    // res.setHeader('Access-Control-Allow-Credentials', 'true')
    // res.setHeader('Access-Control-Allow-Headers', 'Content-type')
})

app.listen(3000, () => {console.log('Server listening at port 3000...')});