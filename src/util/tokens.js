const APIRequest = require("./api-request.js");
const { OAuthError } = require("../classes/error.js");

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
    throw new OAuthError("Invalid grant type", 405)
  }

  let resp = await APIRequest({ type: "POST", path: "https://ruqqus.com/oauth/grant", options: keys, auth: false });
  if (resp.oauth_error) throw new OAuthError(resp.oauth_error, 401);

  return resp;
}

module.exports = fetchTokens;