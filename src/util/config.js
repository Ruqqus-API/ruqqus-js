const fs = require("fs");

function update(obj) {
  fs.writeFileSync(path, JSON.stringify(obj, null, 2));
}

class Config {
  constructor(path) {
    this.path = path;
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

  init(options) {
    let cfg = this.get();

    let obj = options ? {
      autosave: options.autosave || cfg.autosave || true,
      id: options.id || cfg.id || "",
      token: options.token || cfg.token || "",
      agent: options.agent || cfg.agent || "",
      refresh: options.refresh || cfg.refresh || ""
    } : {};

    if (obj) {
      if (cfg != obj) update(obj);
    } else {
      throw new Error("Invalid config object");
    }
  }

  /**
   * Gets an attribute of the config file. If left blank, gets the whole file object.
   * 
   * @param {String} [attribute] The object attribute to get.
   * @return {*} The attribute value.
   */

  get(attribute) {
    try {
      delete require.cache[require.resolve(this.path)];
      let config = require(this.path);

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

  set(attribute, value) {
    let config = this.get();
    if (typeof config[attribute]) {
      config[attribute] = value;
      update(config);
    }
  }
}

module.exports = Config;