const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const mysql = require('mysql');
const config = require('./mydbsql.json');

app.use(express.static(`views`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine', 'pug');
app.set('views', './views');

const pool = mysql.createPool(config);

app.get('/board/page/:page', (req, res) => { // 게시글 리스트에 :page가 추가된것임
    var page = req.params.page; // 현재 페이지는 params 을 req 요청받아옴
    pool.getConnection((err, connection) => {
        if(err) throw err;
        //date format을 바꾸면 다르게 보여줄 수 있음
        // var sQuery =  "select idx, userid, title, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " + 
        // "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from userboard";  // select 구절 그대로
        var sQuery =  "select idx, userid, title, date_format(modidate,'%Y-%m-%d') modidate, " +
        "date_format(regdate,'%Y-%m-%d') regdate, hit from userboard";  // select 구절 그대로

        var cQuery = "SELECT board_idx from commentboard";
        connection.query(cQuery, (err, comment) => {
            if(err) throw err;
            connection.query(sQuery, (err, rows) => {
                if (err) throw err;
                if (req.session.uid==null) {
                    let dataPrim = null;
                    connection.release();
                    return res.render('boardpage', {title : '글목록', rows:rows, page:page, length:rows.length-1, page_num:10, pass:true, loginstate:req.session.loginstate, id:req.session.uid, dataPrim: dataPrim, comment:comment}); 
                }
                connection.query(`SELECT * FROM userinfo WHERE userid= "${req.session.uid}"`, (err, result) => {
                    if (err) throw err;
                    
                    let id = result[0].userid;
                    let point = result[0].userpoint;
                    let dataPrim = {id: id, point: point};
                    connection.release();
                    return res.render('boardpage', {title : '글목록', rows:rows, page:page, length:rows.length-1, page_num:10, pass:true, loginstate:req.session.loginstate, id:req.session.uid, dataPrim: dataPrim, comment:comment}); 
                })
            });
        });
    });
});

app.get('/board/write', (req, res) => {  // board/write 로 접속하면 글쓰기페이지로 이동
    console.log(req.session.uid)
    pool.getConnection((err, connection) =>{
        if(err) throw err;
        connection.query(`SELECT * FROM userinfo WHERE userid= "${req.session.uid}"`, (err, result) => {
            if (err) throw err;
            
            let id = result[0].userid;
            let point = result[0].userpoint;
            let dataPrim = {id: id, point: point};
            connection.release();
            return res.render('write', {title : "게시판 글쓰기", loginstate:req.session.loginstate, id:req.session.uid, dataPrim: dataPrim});
        })
    })
});

app.post('/board/write', (req, res) => {
    var userid= req.session.uid;                   
    var title = req.body.title;
    var content = req.body.content;
    var datas = [userid, title, content]; // 모든데이터를 배열로 묶기
    // req 객체로 body 속성에서 input 파라미터 가져오기
    pool.getConnection((err, connection) =>{
        if(err) throw err;
        var sQuery = "insert into userboard(userid, title, content, regdate, modidate, hit, likeuser) values(?,?,?,now(),now(),0,0)";  // ? 는 매개변수
        var pQuery = `UPDATE userinfo set userpoint=userpoint+10 where userid='${userid}'`;
        connection.query(sQuery, datas, (err,rows) => { // datas 를 매개변수로 추가
            if (err) throw err;

            connection.query(pQuery, (err, result) => {
                if(err) throw err;
                res.send('<script>alert("10포인트가 지급되었습니다"); window.location.href = "/board/page"; </script>');
            })
        })
        connection.release();
    });
});

app.get('/board/read/:idx', (req, res) => { // board/read/idx숫자 형식으로 받을거
    var idx = req.params.idx; // :idx 로 맵핑할 req 값을 가져온다
    req.session.idx = idx;
    var logid =req.session.uid;
    pool.getConnection((err, connection) =>{ //조회수 1씩 증가
        if(err) throw err;
        var hQuery = `UPDATE userboard set hit=hit+1 where idx='${idx}'`;
        connection.query(hQuery,[idx], (err, result) => {
            if(err) throw err;
            var sQuery = "SELECT idx, userid, title, content, date_format(modidate, '%Y-%m-%d %H:%i:%s') modidate, " +   
            "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit, likeuser from userboard where idx=?";
            connection.query(sQuery,[idx], (err, rows) => {  // 한개의 글만조회하기때문에 마지막idx에 매개변수를 받는다
                if(err) throw err;
                var likeusers = rows[0].likeuser.split('/'); // 좋아요 누른 id들의 배열
                var chklike = likeusers.includes(logid); // 좋아요 누른 user에 포함되어 있는지
                var cQuery = "SELECT idx, userid, comments from commentboard where board_idx=?";
                connection.query(cQuery,[idx], (err, comrows) => {
                    if(err) throw err;
                    connection.query(`SELECT * FROM userinfo WHERE userid= "${req.session.uid}"`, (err, result) => {
                        if (err) throw err;
                        let dataPrim=null;
                        if(result.length!=0){
                            let id = result[0].userid;
                            let point = result[0].userpoint;
                            dataPrim = {id: id, point: point};
                        }
                        
                        req.session.idx = idx;
                        connection.release();
                        return res.render('read', {title : '글 상세보기', rows:rows[0], comrows:comrows, loginstate:req.session.loginstate, id:req.session.uid, dataPrim:dataPrim, chklike:chklike}); // 첫번째행 한개의데이터만 랜더링 요청
                    })
                })
            })
        });
    });
});

app.post('/board/update', (req, res) => {
    console.log("update")
    var idx = req.body.idx;
    var userid = req.session.uid;
    var title = req.body.title;
    var content = req.body.content;
    var datas = [idx, userid, title, content]; // 변수설정한 값을 datas 에 배열화

    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        var cQuery = `SELECT userid FROM userboard where idx='${idx}'`
        connection.query(cQuery, (err, result) =>{
            if(err) throw err;

            console.log(result[0].userid);
            if(userid == result[0].userid) {
                var sQuery = `UPDATE userboard set userid='${userid}', title='${title}', content='${content}' ,modidate=now()  where idx='${idx}'`; 
                connection.query(sQuery, datas, (err, result) => {
                    if (err) console.error(err);
                    else {
                        res.redirect('/board/read/' + idx);
                    }
                    connection.release();
                });
            } 
            else {
                res.send('<script>alert("작성자만 수정할 수 있습니다"); window.location.href = "/board/page"; </script>');
            }
        });
    })
    
});

app.post('/board/delete', (req, res) => {
    console.log("delete")
    var userid = req.session.uid;
    var idx = req.body.idx;
    var passwd = req.body.passwd;
    var datas = [idx, passwd];

    pool.getConnection((err, connection) => {
        if(err) throw err;

        var cQuery = `SELECT userid FROM userboard where idx='${idx}'`
        connection.query(cQuery, (err, result) =>{
            if(err) throw err;

            console.log(result[0].userid);
            if(userid == result[0].userid) {
                var sQuery = `DELETE from userboard where idx='${idx}'`; // 업데이트 수정과 거의 비슷한 쿼리문
                    connection.query(sQuery, datas, (err, result) => {
                    if(err) throw err;
                    else {
                        res.redirect('/board/page')
                    }
                    connection.release();
                }); 
            }
            else{
                res.send('<script>alert("작성자만 삭제할 수 있습니다"); window.location.href = "/board/page"; </script>');
            }
        });
    });
});

app.get('/board/rewrite', (req, res) => { 
    var idx = req.session.idx; 
    pool.getConnection((err, connection) =>{ 
        if(err) throw err;

        // if(err) throw err;
        var sQuery = "SELECT idx, userid, title, content, date_format(modidate, '%Y-%m-%d %H:%i:%s') modidate, " +   
        "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from userboard where idx=?";

        connection.query(sQuery,[idx], (err, rows) => {  // 한개의 글만조회하기때문에 마지막idx에 매개변수를 받는다
            if(err) throw err;
            
            connection.query(`SELECT * FROM userinfo WHERE userid= "${req.session.uid}"`, (err, result) => {  // 한개의 글만조회하기때문에 마지막idx에 매개변수를 받는다
                if(err) throw err;
                
                let id = result[0].userid;
                let point = result[0].userpoint;
                let dataPrim = {id: id, point: point};
                connection.release();
                return res.render('rewrite', {title : '글 수정/삭제', rows:rows[0], loginstate:req.session.loginstate, id:req.session.uid, dataPrim: dataPrim})
            });
        });
    });
});


const host = '127.0.0.1';
const port = 3000;

const pool = require("./mysqlcon");

app.listen(3000, ()=>{console.log("Server running at port 3000...")});