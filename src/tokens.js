const Client = require("./classes/client.js");
const { OAuthError } = require("./classes/error.js");

/**
 * Requests the access and refresh tokens through OAuth.
 * 
 * @param {Object} options The request parameters.
 * @param {String} options.id The Application ID.
 * @param {String} options.token The Application secret.
 * @param {String} options.type The grant type.
 * @param {String} [options.code] The one-time use authorization code.
 * @param {String} [options.refresh] The refresh token.
 */

async function fetchTokens(options) {
  if (!options) options = {};
  let keys = {
    client_id: options.id || null,
    client_secret: options.token || null
  };

  if (options.type.toLowerCase() == "code") {
    keys.grant_type = "code";
    keys.code = options.code || null;
  } else if (options.type.toLowerCase() == "refresh") {
    keys.grant_type = "refresh";
    keys.refresh_token = options.refresh || null;
  } else {
    new OAuthError({
      message: "Invalid Request",
      code: 405
    }); return;
  }

  let resp = await Client.APIRequest({ type: "POST", path: "https://ruqqus.com/oauth/grant", options: keys, auth: false });

  if (resp.oauth_error) {
    let type;

    if (resp.oauth_error == "Invalid refresh_token") {
      type = "Refresh Token";
    } else if (resp.oauth_error == "Invalid code") {
      type = "Authcode";
    } else if (resp.oauth_error == "Invalid `client_id` or `client_secret`") {
      type = "ID or Client Secret"
    }

    new OAuthError({
      message: `Invalid ${type}`,
      code: 401,
      fatal: true
    }); return;
  }

  return resp;
}

module.exports = fetchTokens;