from pusher_push_notifications import PushNotifications
import requests
from flask import Flask, render_template, redirect, url_for,request
from flask import make_response

app = Flask(__name__)


beams_client = PushNotifications(
    instance_id='db211b1a-a776-4dc3-83f1-37b8baad8a3a',
    secret_key='059B8118B4CC5EE4C22E8E1A61A87C404562BCCD593E9B372788A50DE7C64ED7',
)


def get_cat_fact():
    response = requests.get('https://cat-fact.herokuapp.com/facts/random?animal_type=cat',
                            headers={'content-type': 'application/json'})
    return response.json()['text']


def get_joke():
    response = requests.get('https://official-joke-api.appspot.com/random_joke',
                            headers={'content-type': 'application/json'})
    joke = response.json()['setup'].strip() + '\n' + response.json()['punchline'].strip()
    return joke


def publish_joke():
    response = beams_client.publish_to_interests(
        interests=['jokes'],
        publish_body={
            'web': {
                'notification': {
                    'title': 'Random joke',
                    'body': get_joke(),
                },
            },
        },
    )
    print(f"Joke published! ID: {response['publishId']}")


def publish_cat_fact():

    response = beams_client.publish_to_interests(
        interests=['cats'],
        publish_body={
            'web': {
                'notification': {
                    'title': 'Cat fact of the Day',
                    'body': get_cat_fact(),
                },
            },
        },
    )
    print(f"Cat fact published! ID: {response['publishId']}")

@app.route("/", methods=['GET', 'POST'])
def getNotif():
	print("Publishing notifs!")
	publish_cat_fact()
	publish_joke()

	return make_response({
		"done": "Code executed!"
	}, 200)

if __name__ == '__main__':
	app.run(debug=True, port=5000)