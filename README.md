# Deaths API

Deaths API is a website for streamers to host to record deaths using GET requests. This allows for it to be used with bots like NightBot. This is intended to be used with one/multiple games that has sections and some sort of death functionality. It can store the deaths data of multiple games at a time in an external database. It also contains a metrics page that you can put as a Browser Source in your OBS as well. Each instance of the website is intended to run only for one streamer.

## Possible Requests

### /getgame

**Description:** Gets the game that is currently selected.

Query Parameters:
| Parameter | Usage |
|-|-|
| public_key | The public key for the API. |

### /setgame

**Description:** Sets the current game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game that will be set as the current game |

### /deletegame

**Description:** Deletes all sections in a game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game data that will be cleared (Optional, defaults to the current game) |

### /getpb

**Description:** Gets the personal best (PB) of the specified game.

Query Parameters:
| Parameter | Usage |
|-|-|
| public_key | The public key for the API. |
| game | The game that the PB is requested from (Optional, defaults to the current game) |

### /setpb

**Description:** Sets the personal best (PB) of the specified game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game that the PB will be set (Optional, defaults to the current game) |
| pb | The PB value that will be set for the game. |

### /deletepb

**Description:** Removes the personal best (PB) of the specified game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game that the PB will be removed (Optional, defaults to the current game) |

### /getsection

**Description:** Gets the total amount of sections in the game (Without deaths).

**Query Parameters:**
| Parameter | Usage |
|-|-|
| public_key | The public key of the API |
| game | The game for the total amount of sections (Optional, defaults to the current game) |

### /addsection

**Description:** Adds a section to the game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game for the total amount of sections (Optional, defaults to the current game) |
| name | The name of the section that would be added |

### /removesection

**Description:** Removes a section from the game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game for the total amount of sections (Optional, defaults to the current game) |
| name | The name of the section that would be added (Alias can be used) |

### /getdeath

**Description:** Gets the total number of deaths of a specified section of the game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| public_key | The public key of the API |
| game | The game specified (Optional, defaults to the current game) |
| section | The name of the section (Alias can be used) |

### /adddeath

**Description:** Adds a death to the specified section of the game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game specified (Optional, defaults to the current game) |
| section | The name of the section (Alias can be used) |

### /removedeath

**Description:** Removes a death from the specified section of the game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game specified (Optional, defaults to the current game) |
| section | The name of the section (Alias can be used) |

### /setdeath

**Description:** Sets the death count of a specified section to a specific amount.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game specified (Optional, defaults to the current game) |
| content | The section followed by the death count, separated by a space bar, eg. 'Forgotten Crossroads 122'. An alias for the section will be read. |

### /getalias

**Description:** Gets the list of alias for a section

**Query Parameters:**
| Parameter | Usage |
|-|-|
| public_key | The public key of the API |
| game | The game that the section belongs to (Optional, defaults to the current game) |
| section | The section that is requested (Alias can be used) |

### /addalias

**Description:** Adds an alias for a section

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game that the section belongs to (Optional, defaults to the current game) |
| content | The section followed by the alias, separated by a space bar. eg. 'Power Source ps'. An alias for the section can be read. The alias that will be added should not contain a space bar. |

### /removealias

**Description:** Removes an alias for a section

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game that the section belongs to (Optional, defaults to the current game) |
| content | The section followed by the alias, separated by a space bar. eg. 'Power Source ps'. An alias for the section can be read. The alias should not contain a space bar. |

### /clearalias

**Description:** Clears the alias list for a section

**Query Parameters:**
| Parameter | Usage |
|-|-|
| private_key | The private key of the API |
| game | The game that the section belongs to (Optional, defaults to the current game) |
| section | The section that will be cleared (Alias can be used) |

### /total

**Description:** Gets the total amount of deaths in the specified game.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| public_key | The public key of the API |
| game | The game specified (Optional, defaults to the current game) |

### /metrics

**Description:** Gets the metrics for the specified game in HTML form.

**Query Parameters:**
| Parameter | Usage |
|-|-|
| metric_key | The metric key of the API |
| game | The game specified (Optional, defaults to the current game) |
| show_total | Whether the total amount would be shown (Optional, defaults to true) |
| show_pb | Whether the personal best will be shown (Optional, defaults to true) |

## Installation

### Requirements

* Basic understanding of the command line
* A location to deploy the program, preferably Heroku ([Account Creation](https://signup.heroku.com/node), [CLI download](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) and [CLI login](https://devcenter.heroku.com/articles/heroku-cli#getting-started))
* [Git](https://git-scm.com/downloads) (Only if you are deploying using Heroku)
* [Node.JS](https://nodejs.org/en/download/)
* [NPM](https://www.npmjs.com/get-npm) (It should be included within Node.JS)
* A [MongoDB](https://docs.atlas.mongodb.com/getting-started/) database connection URL

### Environment Variables

* PRIVATE_KEY: The private key to create and modify games, sections and deaths. This key should not be leaked under **any circumstances**.
* PUBLIC_KEY: The public key to read games, sections and deaths. This key can be provided to your viewers for them to get the number of deaths, sections and games that you have. However, doing so risks having your server being DDOSed by accident due to the large amount of requests received from the viewers. Hence, it is **not recommended** to publicize this key.
* METRIC_KEY: The key to view the metrics page. This key can be provided to your viewers for them to view the current metrics in a browser. However, doing so risks having your server being DDOSed by accident due to the large amount of requests received from the viewers. Hence, it is **not recommended** to publicize this key.
* MONGODB_URL: The URL to access your [MongoDB database](https://docs.atlas.mongodb.com/getting-started/).
* PORT: The port that the server will be deployed on. (Optional, defaults to 4001)
* REFRESH_DURATION: The duration that the metrics page refreshes. (Optional, defaults to 15)
* LOCALE: The language file used for the messages. (Optional, defaults to en-gb)

**Note: PRIVATE_KEY, PUBLIC_KEY and METRIC_KEY are basically your passwords to read or write changes to the API. If any of them is leaked, replace it *as soon as possible*!**

### Deploying Locally

1. Download the [current repository](https://github.com/paxriel/deaths-api/archive/master.zip). If you wish to use a different locale, add your own locales through the Locales section below before moving on to the next step.
2. cd to the download location in cmd or bash
3. Run `npm install --production` if you are running on a production server or `npm install` if it is in a development environment. If you don't really understand what production and development environments are, just run `npm install`.
4. Run `PRIVATE_KEY="YourPrivateKeyHere" PUBLIC_KEY="YourPublicKeyHere" METRIC_KEY="YourMetricKeyHere" MONGODB_URL="YourURLHere" npm start`. If you wish to change your locale, run `LOCALE=YourLocaleHere PRIVATE_KEY="YourPrivateKeyHere" PUBLIC_KEY="YourPublicKeyHere" METRIC_KEY="YourMetricKeyHere" MONGODB_URL="YourURLHere" npm start`.
5. Your server should now be up on `localhost:4001`. To stop the server, enter `Ctrl + C` on your keyboard.
6. To change any environment variables, stop the server and repeat step 4 with your environment variable added to the front, such as `YourVariableHere=YourNewValueHere PRIVATE_KEY="YourPrivateKeyHere" PUBLIC_KEY="YourPublicKeyHere" METRIC_KEY="YourMetricKeyHere" MONGODB_URL="YourURLHere" npm start`.

### Deploying on Heroku

Assuming that you have a Heroku account and the Heroku CLI is already installed,

1. Download the [current repository](https://github.com/paxriel/deaths-api/archive/master.zip). If you wish to use a different locale, add your own locales through the Locales section below before moving on to the next step.
2. cd to the download location in cmd or bash
3. Run `npm install --production` if you are running on a production server or `npm install` if it is in a development environment. If you don't really understand what production and development environments are, just run `npm install`.
4. Run `heroku create YourNameHere`.
5. Run `heroku config:set PRIVATE_KEY="YourPrivateKeyHere"`, `heroku config:set PUBLIC_KEY="YourPublicKeyHere"`, `heroku config:set METRIC_KEY="YourMetricKeyHere"` and `heroku config:set MONGODB_URL="YourURLHere"`
6. If you have a different locale in mind, run `heroku config:set LOCALE=YourLocaleHere`
7. Run `git init`
8. Run `git remote set-url heroku https://git.heroku.com/YourNameHere.git`
9. Run `git add .`, `git commit -m "Initial commit"` and `git push heroku master`
10. Your app is now up on Heroku on `YourNameHere.herokuapp.com`! If you want to test your app locally, refer to the instructions for deploying locally from Step 3 onwards.
11. To change any environment variable, run `heroku config:set YourVariableHere=YourNewValueHere` within the download location.

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
| ![NightBot commands - pg 1](./nightbot_pg1.png) | ![NightBot commands - pg 2](./nightbot_pg2.png) |
| Nightbot commands - pg 1 | Nightbot commands - pg 2 |
| ![The OBS Browser Source used to display the metrics](./obs_source.png) | |
| The OBS Browser Source used to display the metrics| |

## Other Alternatives

* [ehsankia's Quote List API](https://community.nightdev.com/t/customapi-quote-system/7871) (You might need a lot of different API keys though)
* Any Excel Application
