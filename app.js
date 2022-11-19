require("dotenv").config();
const express = require("express");
const request = require("request");
const https = require("https");
const crypto = require('crypto');

const app = express();

// for loading up css and images
app.use(express.static("public"));
// for extracting data from api
app.use(express.urlencoded({ extended: true }));


app.get("/", function (req, res) {
    res.sendFile(__dirname + "/signup.html")
});

app.post("/", function (req, res) {
    apiRequest(req, res, "subscribe");
});


app.get("/unsubscribe", function (req, res) {
    res.sendFile(__dirname + "/unsubscribe.html");
});

app.post("/unsubscribe", function (req, res) {
    apiRequest(req, res, "unsubscribe");
});


function apiRequest(req, res, action) {
    // retrieving data from the user input in website
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.emailAddress;

    // api endpoint + path ("us18" is from api key)
    let url = "https://us18.api.mailchimp.com/3.0/lists/c72bbb22a4";
    // usual status code for referring to success
    let successCode = 200;

    // when user requests for unsubscribing, the api url will change and so will the statusCode
    if (action === "unsubscribe") {
        // path of api link of mailchip needs the hash of the user's email address
        const hash = crypto.createHash('md5').update(email).digest('hex');
        url += "/members/" + hash + "/actions/delete-permanent";
        successCode = 204;
    }

    // ------------------------------------------------------------------------
    // now we have to make a request to mailchimp's server for writing our data

    // these options are needed for https request
    const options = {
        method: "POST",
        auth: process.env.mailchimp_api_key
    }

    // making the https request for posting data on mailchimp's server
    // https.request returns a clientRequest object which is a "writable stream"
    const request = https.request(url, options, function (response) {

        // if all is okay, we will received a successful statusCode from mailchimp
        // which means that now we are ready to write data on their server
        if (response.statusCode === successCode) {
            res.sendFile(__dirname + "/success.html");
        } else {
            res.sendFile(__dirname + "/failure.html");
        }

    });

    // --------------------------------------------------------------------
    // now we have to prepare the data for writing with our writable stream

    // this data will be sent as json using the clientRequest object
    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName,
                }
            }
        ]
    }
    // converting the JS object to JSON-string
    const jsonData = JSON.stringify(data);

    // writing the data in the mailchimp's server
    request.write(jsonData);
    request.end();
}

// we use port = 3000 for local device and
// we are using dynamic port for deploying on heroku
app.listen(process.env.PORT || 3000, function () {
    console.log("Server is listening on port 3000");
});
