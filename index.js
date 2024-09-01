require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI,
	{useNewUrlParser: true, useUnifiedTopology: true}).then(
	() => console.log("MongoDB Connected!")
).catch(
	err => console.log(err)
);

const urlSchema = new mongoose.Schema({
	short_url: {type: Number, required: true},
	original_url: {type: String, required: true},
});

const urlModel = mongoose.model("UrlModel", urlSchema);

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
	res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
	res.json({greeting: 'hello API'});
});

app.get('/api/shorturl/:id', function (req, res) {
	let count = 0;
	const reg = /\d+/;
	if (!reg.test(req.params.id)) {
		res.json({error: "Invalid Short URL Id"});
	}
	const id = parseInt(req.params.id);
	console.log('get_id', id);
	urlModel.findOne({short_url: id}).then(
		items => {
			console.log('items redirect', items["original_url"]);
			res.redirect(items["original_url"], 302);
		}).catch(err => {
		console.log('items error', err);
		res.json({error: err});
	});
});

app.post('/api/shorturl', function (req, res) {
	const original_url = req.body.url;
	const reg = /(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/;
	if (reg.test(original_url)) {
		urlModel.countDocuments({}).then(
			(total) => {
				let urlDemo = new urlModel({
					short_url: total + 1,
					original_url: original_url,
				});
				urlDemo.save().then(
					data => {
						console.log(data);
						res.json({
							"short_url": total + 1,
							"original_url": original_url
						});
					}
				).catch(
					err => {
						console.log(err);
						res.json({error: "Save Failed."});
					});
			}
		);
	} else {
		res.json({error: "Invalid URL"});
	}
});

app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
