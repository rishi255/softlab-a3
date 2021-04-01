const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const PushNotifications = require("@pusher/push-notifications-server");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const app = express();
const port = 5500;
dotenv.config();

const beamsClient = new PushNotifications({
	instanceId: process.env.INSTANCE_ID,
	secretKey: process.env.SECRET_KEY,
});

app.use(cors());
app.use(express.static("public"));

app.get("/pusher/beams-auth", function (req, res) {
	const userId = req.query["user_id"];
	const beamsToken = beamsClient.generateToken(userId);
	res.send(JSON.stringify(beamsToken));
});

function getCatFact(callback) {
	const Http = new XMLHttpRequest();
	Http.open(
		"GET",
		"https://cat-fact.herokuapp.com/facts/random?animal_type=cat"
	);
	Http.send();

	Http.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			// return JSON.parse(Http.responseText).text;
			callback(JSON.parse(Http.responseText).text);
		}
	};
}

function getJoke(callback) {
	const Http = new XMLHttpRequest();
	Http.open("GET", "https://official-joke-api.appspot.com/random_joke");
	Http.send();

	Http.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			let x = JSON.parse(Http.responseText);
			y = x.setup + "\n" + x.punchline;
			// console.log(y);
			callback(y);
		}
	};
}

app.get("/publish", function (req, res) {
	getCatFact((cat_fact) => {
		console.log("CAT FACT: " + cat_fact);
		beamsClient
			.publishToInterests(["cats"], {
				web: {
					notification: {
						title: "Random Cat Fact",
						body: cat_fact,
					},
				},
			})
			.then(
				getJoke((joke) => {
					console.log("JOKE: " + joke);
					beamsClient
						.publishToInterests(["jokes"], {
							web: {
								notification: {
									title: "Random Joke",
									body: joke,
								},
							},
						})
						.catch((e) =>
							res.status(500).send("Internal error:", e)
						);
				})
			)
			.then(res.redirect("/"))
			.catch((e) => res.status(500).send("Internal error:", e));
	});
});

app.listen(process.env.PORT || port, () =>
	console.log(`App listening at port ${process.env.PORT || port}`)
);
