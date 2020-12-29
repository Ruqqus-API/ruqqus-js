const needle = require("needle");
const { RuqqusAPIError } = require("../classes/error.js");

async function APIRequest(options, client) {
  if (!options.type || !options.path || ![ "GET", "POST" ].includes(options.type.toUpperCase())) throw new RuqqusAPIError("Invalid request type");
  if (options.auth == undefined) options.auth = true;

  let resp = await needle(options.type, options.path.startsWith("https://ruqqus.com/") ? options.path : `https://ruqqus.com/api/v1/${options.path.toLowerCase()}`, options.options || {}, options.auth ? { 
    user_agent: client.user_agent, 
    headers: { 
      Authorization: `Bearer ${client.keys.refresh.access_token}`, 
      "X-User-Type": "Bot",
      "X-Library": "ruqqus-js",
      "X-Supports": "auth",
    } } : {});

  if (resp.body.error) {
    let err = resp.body.error.split(" ");
    throw new RuqqusAPIError(err.slice(1).join(" "), err[0]);
  }
  
  return resp.body;
}

module.exports = APIRequest;