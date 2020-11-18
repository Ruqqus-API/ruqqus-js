const needle = require("needle");
const chalk = require("chalk");
const { EventEmitter } = require("events");

const { OAuthWarning, OAuthError } = require("./error.js");
const SubmissionCache = require("./cache.js");
const config = require("../util/config.js");

class Client extends EventEmitter {
  /**
   * Creates a new ruqqus-js Client instance.
   * 
   * @param {Object} options The Application parameters, including the authorization code.
   * @param {String} options.id The Application ID. 
   * @param {String} options.token The Application secret.
   * @param {String} options.code The one-time use authorization code.
   * @param {String} [options.agent] Custom `user_agent`.
   * @param {String} [options.refresh] The refresh token. Overrides authorization code.
   * @constructor
   */

  constructor(options) {
    super();

    if (!options) options = {};
    let cfg = config.get();

    options = cfg ? {
      id: options.id || cfg.id || "",
      token: options.token || cfg.token || "",
      code: options.code || "",
      agent: options.agent || cfg.agent || null,
      refresh: options.refresh || cfg.refresh || null,
    } : options;

    Client.keys = {
      code: {
        id: options.id,
        token: options.token,
        type: "code",
        code: options.code,
      },
      refresh: {
        id: options.id,
        token: options.token,
        type: "refresh",
        refresh: options.refresh || null
      }
    };

    Client.scopes = {};
    Client.userAgent = options.agent || `ruqqus-js@${options.id}`;

    this.startTime = 0;
    this.online = false,

    this._refreshToken();
    this._checkEvents();
  }

  /**
   * Issues a Ruqqus API request.
   * 
   * @param {Object} options The request parameters.
   * @param {String} options.type The request method.
   * @param {String} options.path The request endpoint.
   * @param {Object} [options.auth=true] Whether or not the endpoint needs authorization keys.
   * @param {Object} [options.options={}] Extra request options.
   * @returns {Object} The request response body.
   */
  
  static async APIRequest(options) {
    let methods = [ "GET", "POST" ];
    if (!options.type || !options.path || !methods.includes(options.type.toUpperCase())) {
      new OAuthError({
        message: "Invalid Request",
        code: 405
      }); return;
    }
    
    if (options.auth == undefined) options.auth = true;

    let resp = await needle(options.type, options.path.startsWith("https://ruqqus.com/") ? options.path : `https://ruqqus.com/api/v1/${options.path.toLowerCase()}`, options.options || {}, options.auth ? { 
      user_agent: Client.userAgent, 
      headers: { 
        Authorization: `Bearer ${Client.keys.refresh.access_token}`, 
        "X-User-Type": "Bot",
        "X-Library": "ruqqus-js",
        "X-Supports": "auth",
      } } : {});

    if (resp.body.error && resp.body.error.startsWith("405")) {
      new OAuthError({
        message: "Method Not Allowed",
        code: 405
      }); return;
    }
    
    return resp.body;
  }
  
  _refreshToken() {
    require("../tokens.js")(Client.keys.refresh.refresh ? Client.keys.refresh : Client.keys.code)
      .then(async (resp) => {
        if (resp.oauth_error) {
          let type;

          if (resp.oauth_error == "Invalid refresh_token") {
            type = "Refresh Token";
          } else if (resp.oauth_error == "Invalid code") {
            type = "Authcode";
          } else if (resp.oauth_error == "Invalid `client_id` or `client_secret`") {
            type = "ID or Client Secret"
          }

          return new OAuthError({
            message: `Invalid ${type}`,
            code: 401,
            fatal: true
          });
        }

        resp.scopes.split(",").forEach(s => {
          Client.scopes[s] = true;
        });

        if (config.get("autosave") === true && (!config.get("refresh") || config.get("refresh") == " ") && resp.refresh_token) {
          config.set("refresh", resp.refresh_token);
        }

        Client.keys.refresh.refresh_token = resp.refresh_token || null;
        Client.keys.refresh.access_token = resp.access_token;
        let refreshIn = (resp.expires_at - 5) * 1000 - Date.now()
        
        console.log(`${chalk.greenBright("SUCCESS!")} Token Acquired!\nNext refresh in: ${chalk.yellow(`${Math.floor(refreshIn / 1000)} seconds`)} ${chalk.blueBright(`(${new Date((resp.expires_at - 10) * 1000).toLocaleTimeString("en-US")})`)}`);
        setTimeout(() => { this._refreshToken() }, refreshIn);

        if (!this.online) {
          if (Client.scopes.identity) {
            this.user = new (require("./user.js"))(await Client.APIRequest({ type: "GET", path: "identity" }));
          } else {
            this.user = undefined;
            new OAuthWarning({
              message: 'Missing "Identity" Scope',
              warning: "Client user data will be undefined!"
            });
          }

          let latest = await needle("GET", "https://registry.npmjs.org/ruqqus-js"); latest = Object.keys(latest.body.time); latest = latest[latest.length - 1];
          if (require("../version.js").version != latest) new OAuthWarning({
            message: `Outdated Version (${require(`../version.js`).version})`,
            warning: "Some features may be deprecated!"
          });

          if (!Client.scopes.read) new OAuthWarning({
            message: 'Missing "Read" Scope',
            warning: "Post and Comment events will not be emitted!"
          });

          this.startTime = Date.now();
          this.emit("login");
          this.online = true;
        }
      }).catch(e => console.error(e));
  }

  _checkEvents() {
    setTimeout(() => { this._checkEvents() }, 10000);
    
    if (this.eventNames().includes("post")) {
      if (!Client.scopes.read) return;

      Client.APIRequest({ type: "GET", path: "all/listing", options: { sort: "new" } })
        .then((resp) => {
          if (resp.error) return;

          resp.data.forEach(async p => {
            if (this.posts.cache.get(p.id)) return;

            let post = new (require("./post.js"))(p);
            this.posts.cache.push(post);
            
            if (this.posts.cache._count != 0) {
              this.emit("post", post);
            }
          });

          this.posts.cache._count++;
        });
    }

    if (this.eventNames().includes("comment")) {
      if (!Client.scopes.read) return;
      
      Client.APIRequest({ type: "GET", path: "front/comments", options: { sort: "new" } })
        .then((resp) => {
          if (resp.error) return;

          resp.data.forEach(async c => {
            if (this.comments.cache.get(c.id)) return;

            let comment = new (require("./comment.js"))(c);
            this.comments.cache.push(comment);
            
            if (this.comments.cache._count != 0) {
              this.emit("comment", comment);
            }
          });

          this.comments.cache._count++;
        });
    }
  }

  /**
   * The amount of time that has passed since Client login.
   * 
   * @returns {Number} The time, in seconds.
   */

  get uptime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
  
  guilds = {
    /**
     * Fetches a guild with the specified name.
     * 
     * @param {String} name The guild name.
     * @returns {Guild} The guild object.
     */

    async fetch(name) {
      if (!Client.scopes.read) {
        new OAuthError({
          message: 'Missing "Read" Scope',
          code: 401
        }); return;
      }

      return new (require("./guild.js"))(await Client.APIRequest({ type: "GET", path: `guild/${name}` }));
    },

    /**
     * Fetches whether or not a guild with the specified name is available.
     * 
     * @param {String} name The guild name.
     * @returns {Boolean}
     */

    async isAvailable(name) {
      if (!name) return undefined;
      let resp = await Client.APIRequest({ type: "GET", path: `board_available/${name}` });

      return resp.available;
    }
  }

  posts = {
    /**
     * Fetches a post with the specified ID.
     * 
     * @param {String} id The post ID.
     * @returns {Post} The post object.
     */

    async fetch(id) {
      if (!Client.scopes.read) {
        new OAuthError({
          message: 'Missing "Read" Scope',
          code: 401
        }); return;
      }

      let post = new (require("./post.js"))(await Client.APIRequest({ type: "GET", path: `post/${id}` }));

      this.cache.push(post);
      return post;
    },

    cache: new SubmissionCache()
  }

  comments = {
    /**
     * Fetches a comment with the specified ID.
     * 
     * @param {String} id The comment ID.
     * @returns {Comment} The comment object.
     */

    async fetch(id) {
      if (!Client.scopes.read) {
        new OAuthError({
          message: 'Missing "Read" Scope',
          code: 401
        }); return;
      }

      let comment = new (require("./comment.js"))(await Client.APIRequest({ type: "GET", path: `comment/${id}` }));

      this.cache.push(comment);
      return comment;
    },

    cache: new SubmissionCache()
  }

  users = {
    /**
     * Fetches a user with the specified username.
     * 
     * @param {String} username The user's name.
     * @returns {User} The user object.
     */

    async fetch(username) {
      if (!Client.scopes.read) {
        new OAuthError({
          message: 'Missing "Read" Scope',
          code: 401
        }); return;
      }

      return new (require("./user.js"))(await Client.APIRequest({ type: "GET", path: `user/${username}` }));
    },

    /**
     * Fetches whether or not a user with the specified username is available.
     * 
     * @param {String} username The user's name.
     * @returns {Boolean}
     */
    
    async isAvailable(username) {
      if (!username) return undefined;
      let resp = await Client.APIRequest({ type: "GET", path: `is_available/${username}` });

      return Object.values(resp)[0];
    }
  }
}

module.exports = Client;