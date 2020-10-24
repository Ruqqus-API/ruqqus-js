const fs = require("fs");

const { OAuthError } = require("../classes/error.js");
const path = `${__dirname}/config.json`;

function update(obj) {
  fs.writeFileSync(path, JSON.stringify(obj, null, 2));
}

/**
 * The ruqqus-js config file. Overrides some Client constructor parameters.
 * 
 * @param {Object} options The config parameters.
 * @param {Boolean} [options.autosave=true] Whether or not the refresh token should be automatically saved for restarts.
 * @param {Object} [options.keys] The Application parameters.
 * @param {String} [options.keys.id] The Application ID.
 * @param {String} [options.keys.token] The Application secret. 
 * @param {String} [options.agent] Custom `user_agent`.
 * @param {String} [options.refresh] Refresh token. Overrides authorization code.
 */

function config(options) {
  let cfg = config.get();

  let obj = options ? {
    autosave: options.autosave || cfg.autosave || true,
    keys: options.keys ? {
      id: options.keys.id || cfg.keys.id || "",
      token: options.keys.token || cfg.keys.token || ""
    } : {},
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
 * Regenerates the config file.
 */

config.regenerate = function() {
  try {
    fs.accessSync(path);
  } catch (e) {
    update({ 
      autosave: null,
      keys: {
        id: "",
        token: ""
      },
      agent: "",
      refresh: ""
    });
  }
}

/**
 * Gets an attribute of the config file. If left blank, get the whole file object.
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
    config.regenerate();
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

module.exports = config;