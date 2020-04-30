// Include the required libraries for
const sqlite3 = require('sqlite3').verbose();
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var md5 = require('md5');
//var fs = require('fs');
var Request = require("request");
//var CryptoJS = require("crypto-js");
var app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
require('dotenv').config()

// Setting the View and resources Folder. Choosing the EJS module. //
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                           MAIN FUNCTION                                                   //
// Intialize and connecting to a local database. Create user table and insert initial Demo user to the table //
//               Sending Get Request to retrieve a 5000 enteries Data sample for Car Crushes                 //                                  
//                              Create Table for the Data from NYC OPEN DATA                                 //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
file_path = "./nodeDB.sqlite"
let nodeDB = new sqlite3.Database(file_path, (err) => { 
    if (err) { 
        console.log('Error when creating the database', err) 
    } else { 
        console.log(`Database created!`)
        // Creating Data Table for users data //
        nodeDB.run(`CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userName text, 
            userPassword text, 
			userEmail text
            )`,
            //CONSTRAINT name_unique UNIQUE (userName),
            (err) => {
                if (err) {
                    console.log("User Table Exists");
                }else{
                    console.log("User Table was Created");
                    userN = process.env.USER
					pass = md5(process.env.PASS);
					console.log(pass);
                    nodeDB.run("INSERT INTO user (userName, userPassword, userEmail) VALUES ('"+userN+"', '"+pass+"', 'test@test.com')")
                }
            });
            // Creating Data Table for NYC OPEN DATA //
            nodeDB.run(`CREATE TABLE crash_data (
                collision_id integer PRIMARY KEY,
                crash_date text,
                crash_time text,
                borough text,
                zip_code text,
                on_street_name text,
                number_of_persons_injured text,
                number_of_persons_killed text,
                contributing_factor_vehicle_1 text,
                vehicle_type_code1 text
                )`,
                (err) => {
                    if (err) {
                        console.log("Data Table Exists");
                    }else{
                        console.log("Data Table was Created");
                        Request.get({
                            // https://data.cityofnewyork.us/resource/h9gi-nx95.json?crash_date=2012-07-01T00:00:00.000
                             "url": "https://data.cityofnewyork.us/resource/h9gi-nx95?$$app_token=Kwn7E7Q4egk7mGBF7iqjThzNR&$limit=2000",
                         }, (error, response, body) => {
                             if(error) {
                                 return console.dir(error);
                             }
                             let dataReceived = JSON.parse(body);
                             for(var j = 0; j < dataReceived.length; j++)
                             {
                                 nodeDB.run(
                                    "INSERT INTO crash_data(collision_id,crash_date,crash_time,borough,zip_code,on_street_name,number_of_persons_injured,number_of_persons_killed,contributing_factor_vehicle_1, vehicle_type_code1) VALUES('"+dataReceived[j].collision_id+"','"+dataReceived[j].crash_date+"','"+dataReceived[j].crash_time+"','"+dataReceived[j].borough+"','"+dataReceived[j].zip_code+"','"+dataReceived[j].on_street_name+"','"+dataReceived[j].number_of_persons_injured+"','"+dataReceived[j].number_of_persons_killed+"','"+dataReceived[j].contributing_factor_vehicle_1+"','"+dataReceived[j].vehicle_type_code1+"')")
                         }});                   
                }});    
    }});

  // Post request for web registeration. It will add the user name, password and email to the database //
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

// Post request for web login. If the user name and password found in the database, the session will established with the user name //
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



// Reading Data From the Database and sending the Data Page if session is active //
app.get("/data", function(req, res) {  
   // if (req.session.loggedin) {
    const sql = "SELECT * FROM crash_data"
    nodeDB.all(sql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("data", { model: rows });
    });
 // }
  //else {
    //res.send('Please login to view this page!');
  //  res.end();
//}
});

// Sending Login Page if there is no active session //
app.get('/login', function(request, response) {
    if (!request.session.loggedin) {
        response.render("login");
    } else {
		response.send('You are already logged in!');
	}
	response.end();
});

// Sending Register Page if there is no active session //
app.get('/register', function(request, response) {
    if (!request.session.loggedin) {
        response.render("register");
    } else {
		response.send('You are already logged in!');
	}
	response.end();
});

// Sending Register Page if the user is in active session //
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

// Sending the main index Page //  
app.get('/', function(request, response) {
	response.render("index");
});

// Starting the App //
app.listen(process.env.PORT || 3370, () => console.log('webhook is listening'));