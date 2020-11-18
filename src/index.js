/*
*                                                            d8b                .d8888b.       .d8888b.  
*                                                            Y8P               d88P  Y88b     d88P  Y88b 
*                                                                                   .d88P     888    888 
888d888 888  888  .d88888  .d88888 888  888 .d8888b         8888 .d8888b           8888"      888    888 
888P"   888  888 d88" 888 d88" 888 888  888 88K             "888 88K                "Y8b.     888    888 
888     888  888 888  888 888  888 888  888 "Y8888b. 888888  888 "Y8888b.      888    888     888    888 
888     Y88b 888 Y88b 888 Y88b 888 Y88b 888      X88         888      X88      Y88b  d88P d8b Y88b  d88P 
888      "Y88888  "Y88888  "Y88888  "Y88888  88888P'         888  88888P'       "Y8888P"  Y8P  "Y8888P"  
*                     888      888                           888                                         
*                     888      888                          d88P                                         
*                     888      888                        888P"                                          
*/

const Client = require("./classes/client.js");
const { OAuthWarning, OAuthError } = require("./classes/error.js");
const { getAuthURL, getAuthURLInput } = require("./url.js");
const fetchTokens = require("./tokens.js");
const { version } = require("./version.js");
const config = require("./util/config.js");

module.exports = { Client, OAuthWarning, OAuthError, getAuthURL, getAuthURLInput, fetchTokens, version, config };