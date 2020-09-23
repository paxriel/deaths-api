# 死亡API

死亡API是一个专门给直播主来记录在游戏里面死几次的网站。这个API是用GET请求，所以可以和其他的机器人像Nightbot并用。这个API最适合用在有区域或部分的游戏。它可以把很多个游戏的死亡记录记载在一个数据库里面。它也有一个指标页面让你可以放在OBS的游览器源里面。每一个死亡API的网站只能给一个直播主使用。

[English version](./README.md)

## 请求

### /getgame

**说明：** 获取当前选择的游戏。

**查询参数:**
| 参数 | 用法 |
|-|-|
| public_key | API的公钥。 |

### /setgame

**说明：** 选择现在在玩的游戏。

**查询参数:**
| 参数 | 用法 |
|-|-|
| private_key | API的密钥。 |
| game | 现在要玩的游戏。 |

### /deletegame

**说明：** 删除游戏里所有的部分。

**查询参数:**
| 参数 | 用法 |
|-|-|
| private_key | API的密钥。 |
| game | 要被清除的游戏。（可选，默认是现在在玩的游戏） |

### /getsection

**说明：** 获取一个游戏中所有的部分。（名字而已，不包括死亡次数）

**查询参数:**
| 参数 | 用法 |
|-|-|
| public_key | API的公钥。 |
| game | 要获取部分的游戏。（可选，默认是现在在玩的游戏） |

### /addsection

**说明：** 在游戏里加一个部分。

**查询参数:**
| 参数 | 用法 |
|-|-|
| private_key | API的密钥。 |
| game | 要加部分的游戏。（可选，默认是现在在玩的游戏） |
| name | 新部分的名字。 |

### /removesection

**说明：** 在游戏里删除一个部分。

**查询参数:**
| 参数 | 用法 |
|-|-|
| private_key | API的密钥。 |
| game | 要删除部分的游戏。（可选，默认是现在在玩的游戏） |
| name | 要删除的部分的名字。 |

### /getdeath

**说明：** 查询某一个部分里死了多少次。

**查询参数:**
| 参数 | 用法 |
|-|-|
| public_key | API的公钥。 |
| game | 要查询部分的游戏。（可选，默认是现在在玩的游戏） |
| section | 要查询的部分 |

### /adddeath

**说明：** 把某一个部分的死亡次数+1。

**查询参数:**
| 参数 | 用法 |
|-|-|
| private_key | API的密钥。 |
| game | 要加死亡次数的部分的游戏。（可选，默认是现在在玩的游戏） |
| name | 要加死亡次数的部分的名字。 |

### /removedeath

**说明：** 把某一个部分的死亡次数-1。

**查询参数:**
| 参数 | 用法 |
|-|-|
| private_key | API的密钥。 |
| game | 要减死亡次数的部分的游戏。（可选，默认是现在在玩的游戏） |
| name | 要减死亡次数的部分的名字。 |

### /setdeath

**说明：** 设置某一个部分的死亡次数。

**查询参数:**
| 参数 | 用法 |
|-|-|
| private_key | API的密钥。 |
| game | 要设置亡次数的部分的游戏。（可选，默认是现在在玩的游戏） |
| content | 要设置死亡次数的部分加上要的死亡次数，中间隔一个空格，例如 '被遗忘的十字入口 122' |

### /total

**说明：** 获取某一个游戏总共的死亡次数。

**查询参数:**
| 参数 | 用法 |
|-|-|
| public_key | API的公钥。 |
| game | 要查询的游戏。（可选，默认是现在在玩的游戏） |

### /metrics

**说明：** 获取某一个游戏的指标页面。这个请求会送回一个HTML文件。

**查询参数:**
| 参数 | 用法 |
|-|-|
| metric_key | API的指标钥。 |
| game | 要查询的游戏。（可选，默认是现在在玩的游戏） |
| show_total | 要不要显示总共的死亡次数。（可选，默认是true） |

## 如何安装

### 先决条件

* 对于命令行有基本的了解
* 部署网站的位置，推荐Heroku([账户创建](https://signup.heroku.com/node)，[CLI 下载](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)和[CLI 登录](https://devcenter.heroku.com/articles/heroku-cli#getting-started))
* [Git](https://git-scm.com/downloads) (仅当用Heroku进行部署时)
* [Node.JS](https://nodejs.org/en/download/)
* [NPM](https://www.npmjs.com/get-npm) (应包含在Node.JS中)
* 一个[MongoDB](https://docs.atlas.mongodb.com/getting-started/)数据库的连接URL

### 环境参数

* PRIVATE_KEY: 创建和修改游戏，部分和死亡次数的私钥。这个密钥在**任何情况下都不能被泄露**。
* PUBLIC_KEY: 读取游戏，栏目和死亡信息的公钥。这个公钥可以给观众用来获得游戏，部分和死亡次数的资料。由于大量的观众很有可能查询这些资料，这很有可能会导致你的服务器被DDOS。因此，这个密钥**不建议公开**。
* METRIC_KEY: 读取指标的钥匙。这个钥匙可以给观众用来获得指标的页面。由于大量的观众很有可能查询这些资料，这很有可能会导致你的服务器被DDOS。因此，这个密钥**不建议公开**。
* MONGODB_URL: 你的[MongoDB数据库](https://docs.atlas.mongodb.com/getting-started/)的连接URL。
* PORT: 网站在服务器上的端口。（可选，默认为4001）
* REFRESH_DURATION: 指标页面刷新的间隔。（可选，默认为15）

**注意: PRIVATE_KEY, PUBLIC_KEY and METRIC_KEY 是用来读或更改API资料的密码。如果任何一个密码被泄露，它们应当*马上*被更改。**

### 本地部署

1. 下载储存库里[最新的版本](https://github.com/paxriel/deaths-api/archive/master.zip)
2. 用cmd或bash cd到下载的位置
3. 如果在生产服务器上运行，请输入`npm install --production`。如果在开发环境中运行，请输入`npm install`。如果你不知道什么是生产服务器或是开发环境，请输入`npm install`。
4. 输入`PRIVATE_KEY="你的密钥" PUBLIC_KEY="你的公钥" METRIC_KEY="你的指标钥" MONGODB_URL="你的MongoDB数据库的连接URL" npm start`
5. 你的网站现在在`localhost:4001`上运行。若你要停止运行，在键盘上输入`Ctrl + C`。
6. 若要要更改任何的环境参数，请停止运行并重复步骤4。

### 在Heroku部署

如果你已经有一个Heroku户口，而且Heroku CLI已经安装在电脑上，

1. 下载储存库里[最新的版本](https://github.com/paxriel/deaths-api/archive/master.zip)
2. 用cmd或bash cd到下载的位置
3. 如果在生产服务器上运行，请输入`npm install --production`。如果在开发环境中运行，请输入`npm install`。如果你不知道什么是生产服务器或是开发环境，请输入`npm install`。
4. 输入`heroku create 网站名字`
5. 输入`heroku config:set PRIVATE_KEY="你的密钥"`，`heroku config:set PUBLIC_KEY="你的公钥"`，`heroku config:set METRIC_KEY="你的指标钥"`和`heroku config:set MONGODB_URL="你的MongoDB数据库的连接URL"`
6. 输入`git init`
7. 输入`git remote set-url heroku https://git.heroku.com/网站名字.git`
8. 输入`git add .`，`git commit -m "Initial commit"`和`git push heroku master`
9. 你的网站现在在 `网站名字.herokuapp.com`上运行。如果你要在本地试试看可不可以用，请参考本地部署步骤3开始的部分。
10. 若要要更改任何的环境参数，在下载的位置输入`heroku config:set 参数名=新参数值`。

## 使用例子

| | |
|-|-|
| ![NightBot commands - pg 1](./nightbot_pg1.png) | ![NightBot commands - pg 2](./nightbot_pg2.png) |
| Nightbot命令（1） | Nightbot命令（2） |
| ![The OBS Browser Source used to display the metrics](./obs_source.png) | |
| 用于显示指标的OBS浏览器源 | |

## 其他选择

* [ehsankia的Quote List API](https://community.nightdev.com/t/customapi-quote-system/7871) (可能得用到很多个密钥)
* 任何Excel的应用程序
