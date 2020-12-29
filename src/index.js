/*
*                                                            d8b                   d8888       .d8888b.  
*                                                            Y8P                  d8P888      d88P  Y88b 
*                                                                                d8P 888      888    888 
888d888 888  888  .d88888  .d88888 888  888 .d8888b         8888 .d8888b        d8P  888      888    888 
888P"   888  888 d88" 888 d88" 888 888  888 88K             "888 88K           d88   888      888    888 
888     888  888 888  888 888  888 888  888 "Y8888b. 888888  888 "Y8888b.      8888888888     888    888 
888     Y88b 888 Y88b 888 Y88b 888 Y88b 888      X88         888      X88            888  d8b Y88b  d88P 
888      "Y88888  "Y88888  "Y88888  "Y88888  88888P'         888  88888P'            888  Y8P  "Y8888P"  
*                     888      888                           888                                         
*                     888      888                          d88P                                         
*                     888      888                        888P"                                          
*/

const Client = require("./classes/client.js");
const { OAuthError, ScopeError, RuqqusAPIError } = require("./classes/error.js");
const { getAuthURL, getAuthURLInput } = require("./util/auth-url.js");
const fetchTokens = require("./util/tokens.js");
const { version } = require("./util/version.js");

module.exports = { Client, OAuthError, ScopeError, RuqqusAPIError, getAuthURL, getAuthURLInput, fetchTokens, version, };