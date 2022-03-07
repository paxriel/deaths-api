# Deaths API

Deaths API is a website for streamers to host to record deaths using GET requests. This allows for it to be used with bots like NightBot. This is intended to be used with one/multiple games that has sections and some sort of death functionality. It can store the deaths data of multiple games at a time in an external database. It also contains a metrics page that you can put as a Browser Source in your OBS as well. Each instance of the website is intended to run only for one streamer.

## Commands List

## Installation

### Requirements

* Basic understanding of the command line
* A location to deploy the program, preferably Heroku ([Account Creation](https://signup.heroku.com/node), [CLI download](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) and [CLI login](https://devcenter.heroku.com/articles/heroku-cli#getting-started))
* [Git](https://git-scm.com/downloads) (Only if you are deploying using Heroku)
* [Node.JS](https://nodejs.org/en/download/)
* [NPM](https://www.npmjs.com/get-npm) (It should be included within Node.JS)
* A [MongoDB](https://docs.atlas.mongodb.com/getting-started/) database connection URL

### Environment Variables

* METRIC_KEY: The key to view the metrics page. This key can be provided to your viewers for them to view the current metrics in a browser. However, doing so risks having your server being DDOSed by accident due to the large amount of requests received from the viewers. Hence, it is **not recommended** to publicize this key.
* MONGODB_URL: The URL to access your [MongoDB database](https://docs.atlas.mongodb.com/getting-started/).
* PORT: The port that the server will be deployed on. (Optional, defaults to 4001)
* REFRESH_DURATION: The duration that the metrics page refreshes. (Optional, defaults to 15)
* LOCALE: The language file used for the messages. (Optional, defaults to en-gb)
* TWITCH_ACCESS:
* TWITCH_REFRESH:
* TWITCH_CHANNEL:
* TWITCH_CHANNEL_ID:
* TWITCH_CHANNEL_SECRET:

### Deploying Locally

1. Download the [current repository](https://github.com/paxriel/deaths-api/archive/master.zip). If you wish to use a different locale, add your own locales through the Locales section below before moving on to the next step.
2. cd to the download location in cmd or bash
3. Run `npm install --production` if you are running on a production server or `npm install` if it is in a development environment. If you don't really understand what production and development environments are, just run `npm install`.
4. Set the required environment variables in the .env file and run `npm test`.
5. Your server should now be up on `localhost:4001`. To stop the server, enter `Ctrl + C` on your keyboard.
6. To change any environment variables, stop the server and change the environment variables in the .env file, then restart the app.

### Deploying on Heroku

TODO: Complete

## Locales

### How It Works

The files for locales are stored in JSON format in the `locales` folder. Each locale would have its own JSON file, which contains a single object. Each attribute in the object would be a string corresponding to the message of that attribute in its specific locale. As of now, only one locale (en-gb) is included, but it is possible to create your own locale.

### Locale Selection

The selection for the locale is done using the environment variable `LOCALE`. If you are not sure how to change environment variables, they are mentioned in the deployment sections.

### Create Your Own Locale

To create your own locale, you can create the corresponding `YourLocaleHere.json` file in the `locales` folder. The JSON object in the file should contain attributes that match the value in the file. The [en-gb.json](./locales/en-gb.json) file could be used as a reference for all the possible attributes that are available in the file. Once done, just set the `LOCALE` environment variable to your file name, and your locale would be used. If you are not sure how to change environment variables, they are mentioned in the deployment sections.

### Templates

Certain attributes in Locale strings can contain templates which would be replaced by a specific variable within the website. For instance, if a string contains `${game}`, it will be automatically replaced by the game specified. The current list of templates are follows:

| Template | Variable |
|-|-|
| ${game} | The game specified |
| ${section} | The section specified |
| ${deaths} | The amount of deaths for that section, or the total deaths in a game |
| ${pb} | The personal best in a game |
| ${alias} | The specific alias for a section. |
| ${port} | The port that the server is running on. |

The availibility of the templates for each attribute can be found in the [.values.json](./locales/.values.json) file in the `locales` directory. For instance, if an attribubte in the JSON file contains `${game}, ${deaths}`, it means that those two template strings will be recognized and replaced.

## Example Implementation

| | |
|-|-|
| ![The OBS Browser Source used to display the metrics](./obs_source.png) | |
| The OBS Browser Source used to display the metrics| |

## Other Alternatives

* [ehsankia's Quote List API](https://community.nightdev.com/t/customapi-quote-system/7871) (You might need a lot of different API keys though)
* Any Excel Application
