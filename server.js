const axios = require("axios");
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

async function getCatFact() {
	let res = await axios.get(
		"https://cat-fact.herokuapp.com/facts/random?animal_type=cat"
	);
	console.log(res.data);
	// console.log("Cat fact done: " + res.data.text);
	return res.data.text;
}

async function getJoke() {
	let res = await axios.get(
		"https://official-joke-api.appspot.com/random_joke"
	);
	let x = res.data;
	y = x.setup + "\n" + x.punchline;
	// console.log("Joke done: " + y);
	return y;
}

app.get("/publish", function (req, res) {
	getCatFact().then((cat_fact) => {
		beamsClient
			.publishToInterests(["cats"], {
				web: {
					notification: {
						title: "Random Cat Fact",
						body: cat_fact,
					},
				},
			})
			.then(console.log("PUBLISHED CAT FACT: " + cat_fact))
			.catch((e) => res.status(500).send("Internal error:", e));
	});
	getJoke()
		.then((joke) => {
			beamsClient
				.publishToInterests(["jokes"], {
					web: {
						notification: {
							title: "Random Joke",
							body: joke,
						},
					},
				})
				.then(console.log("PUBLISHED JOKE: " + joke))
				.catch((e) => res.status(500).send("Internal error:", e));
		})
		.then(console.log("All published!"))
		.then(res.redirect("/"))
		.catch((e) => res.status(500).send("Internal error:", e));
});

app.listen(process.env.PORT || port, () =>
	console.log(`App listening at port ${process.env.PORT || port}`)
);
