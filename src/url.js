const { OAuthError } = require("./classes/error.js");

/**
 * Generates a URL for obtaining an authorization code.
 * 
 * @param {Object} options The URL parameters.
 * @param {String} options.id The Application ID.
 * @param {String} options.redirect The Application redirect URI.
 * @param {String} [options.state=ruqqus-js] The Application state token.
 * @param {String[]|String} options.scopes The Application scopes. Either a string of values separated by commas or an array.
 * @param {Boolean} [options.permanent=true] Whether or not the Application will have permanent access to the account.
 * @returns {String} The generated URL.
 */

function getAuthURL(options) {
  let scopeList = [ "identity", "create", "read", "update", "delete", "vote", "guildmaster" ];
  let scopes;

  if (Array.isArray(options.scopes)) scopes = options.scopes;
  else if (typeof options.scopes == "string") {
    if (!options.scopes || options.scopes == " ") {
      new OAuthError({
        message: "Invalid Scope Parameter",
        code: 401
      }); return;
    }

    if (options.scopes == "all") scopes = scopeList;
    else scopes = options.scopes.split(",");
  } else {
    new OAuthError({
      message: "Invalid Scope Parameter",
      code: 401
    }); return;
  }
  
  if (!options.id || options.id == " ") {
    new OAuthError({
      message: "Invalid ID Parameter",
      code: 401
    }); return;
  }
  
  scopes = scopes.filter(s => scopeList.includes(s.toLowerCase())).map(s => {
    return s.toLowerCase();
  });

  if (!options.redirect || options.redirect == " ") options.redirect = "http://localhost";

  return `https://ruqqus.com/oauth/authorize?client_id=${options.id}&redirect_uri=${options.redirect.startsWith("http") ? options.redirect : `https://${options.redirect}`}&state=${options.state || "ruqqus-js"}&scope=${scopes}${options.permanent ? "&permanent=true" : ""}`;
}

/**
 * Generates a URL for obtaining an authorization code based on console input. Exits the process upon completion.
 */

function getAuthURLInput() {
  const chalk = require("chalk");
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\r");
  rl.question(`${chalk.yellow("Application ID")}: `, id => 
    rl.question(`${chalk.yellow("Redirect URI")}: `, redirect => 
    rl.question(`${chalk.yellow("State Token")}: `, state => 
    rl.question(`${chalk.yellow("Scope List")}: `, scopes => 
    rl.question(`${chalk.yellow("Permanent (y/n)")}: `, permanent => {
      console.log("\r");

      let generatedURL = getAuthURL({
        id, redirect, state, 
        scopes: scopes || "all", 
        permanent: ["y", "yes"].includes(permanent.toLowerCase())
      });

      if (generatedURL) console.log(`${chalk.yellow("Generated URL:")} ${generatedURL}\r`);

      process.exit();
    })
  ))));
}

module.exports = { getAuthURL, getAuthURLInput };