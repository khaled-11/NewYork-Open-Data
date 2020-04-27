const sqlite3 = require('sqlite3').verbose();
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var md5 = require('md5');
//var CryptoJS = require("crypto-js");
const request = require('request');
var app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
require('dotenv').config()

app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get('/login', function(request, response) {
    if (!request.session.loggedin) {
        response.render("login");
    } else {
		response.send('You are already logged in!');
	}
	response.end();
});

app.get('/register', function(request, response) {
    if (!request.session.loggedin) {
        response.render("register");
    } else {
		response.send('You are already logged in!');
	}
	response.end();
});

app.get('/logout', function(request, response) {
    if (request.session.loggedin) {
      request.session.destroy()
      response.clearCookie('connect.sid')
      response.render("logout");
    } else {
	  response.send('You are not logged in!');
    }
    response.end();
  });

app.get('/', function(request, response) {
	response.render("index");
});

app.get("/books", (req, res) => {
    const sql = "SELECT * FROM user"
    nodeDB.all(sql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("books", { model: rows });
    });
  });

//Creating a database and table
file_path = "./nodeDB.sqlite"
let nodeDB = new sqlite3.Database(file_path, (err) => { 
    if (err) { 
        console.log('Error when creating the database', err) 
    } else { 
        console.log(`Database created!`)
        nodeDB.run(`CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userName text, 
            userPassword text, 
			userEmail text
            )`,
            //CONSTRAINT name_unique UNIQUE (userName),
            //CONSTRAINT email_unique UNIQUE (userEmail)
            (err) => {
                if (err) {
                    console.log("Database Exist");
                }else{
                    userN = process.env.USER
					pass = md5(process.env.PASS);
					console.log(pass);
                    nodeDB.run("INSERT INTO user (userName, userPassword, userEmail) VALUES ('"+userN+"', '"+pass+"', 'test@test.com')")
                }
            });  
    } 
  });

  app.post('/register', function(request, res) {
	var username = request.body.username;
    var email = request.body.email;
    console.log(email)
    console.log(username)
    console.log(request.body.password)
	var password = md5(request.body.password);
	console.log(password)
	if (username && password && email) {
            nodeDB.run("INSERT INTO user (userName, userPassword, userEmail) VALUES ('"+username+"', '"+password+"', '"+email+"')")
        request.session.loggedin = true;
		request.session.username = username;
		res.redirect('/');
	} else {
		res.send('Please enter all the required information!');
		res.end();
	}
});


app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = md5(request.body.password);

	
	if (username && password) {
		nodeDB.all("SELECT * FROM user WHERE userName = '"+username+"' AND userPassword = '"+password+"'", function(error, results, fields) {
            if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});





app.get('/data', function(request, response) {
	if (request.session.loggedin) {
        response.render("data");
    	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});

app.listen(process.env.PORT || 3370, () => console.log('webhook is listening'));