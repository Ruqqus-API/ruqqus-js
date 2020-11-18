const fs = require("fs");

const { OAuthError } = require("../classes/error.js");
let path = `${__dirname}/config.json`;

function update(obj) {
  fs.writeFileSync(path, JSON.stringify(obj, null, 2));
}

/**
 * The ruqqus-js config file. Overrides some Client constructor parameters.
 * 
 * @param {Object} options The config parameters.
 * @param {Boolean} [options.autosave=true] Whether or not the refresh token should be automatically saved for restarts.
 * @param {String} [options.id] The Application ID.
 * @param {String} [options.token] The Application secret. 
 * @param {String} [options.agent] Custom `user_agent`.
 * @param {String} [options.refresh] Refresh token. Overrides authorization code.
 */

function config(options) {
  let cfg = config.get();

  let obj = options ? {
    autosave: options.autosave || cfg.autosave || true,
    id: options.id || cfg.id || "",
    token: options.token || cfg.token || "",
    agent: options.agent || cfg.agent || "",
    refresh: options.refresh || cfg.refresh || ""
  } : {};

  if (obj) {
    if (config.get() != obj) update(obj);
  } else {
    new OAuthError({
      message: "No Config Provided",
      code: 405
    });
  }
}

/**
 * Gets an attribute of the config file. If left blank, gets the whole file object.
 * 
 * @param {String} [attribute] The object attribute to get.
 * @return {*} The attribute value.
 */

config.get = function(attribute) {
  try {
    delete require.cache[require.resolve(path)];
    let config = require(path);

    if (attribute) return config[attribute];
    else return config;
  } catch (e) {
    return undefined;
  }
}

/**
 * Sets an attribute of the config file.
 * 
 * @param {String} attribute The object attribute to set.
 * @param {*} value The attribute value.
 */

config.set = function(attribute, value) {
  let config = this.get();
  if (typeof config[attribute]) {
    config[attribute] = value;
    update(config);
  }
}

/**
 * Sets the config file directory.
 * 
 * @param {String} dir The config directory.
 */

config.path = function(dir) {
  path = dir || `${__dirname}/config.json`;
}

module.exports = config;