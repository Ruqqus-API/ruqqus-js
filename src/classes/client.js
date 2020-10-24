const needle = require("needle");
const chalk = require("chalk");
const { EventEmitter } = require("events");

const { OAuthWarning, OAuthError } = require("./error.js");
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
   * @param {String} [options.refresh] Refresh token. Overrides authorization code.
   * @constructor
   */

  constructor(options) {
    super();

    if (!options) options = {};
    let cfg = config.get();

    options = cfg ? {
      id: cfg.keys.id || "",
      token: cfg.keys.token || "",
      code: options.code || "",
      agent: cfg.agent || null,
      refresh: cfg.refresh || null,
    } : options;

    Client.keys = {
      code: {
        client_id: options.id,
        client_secret: options.token,
        grant_type: "code",
        code: options.code,
      },
      refresh: {
        client_id: options.id,
        client_secret: options.token,
        grant_type: "refresh",
        refresh_token: options.refresh || null
      }
    };

    Client.scopes = {};
    Client.userAgent = options.agent || `ruqqus-js@${options.id}`;

    this.startTime = 0;
    this.online = false,

    this.cache = {
      _postCount: 0,
      posts: [],
      _commentCount: 0,
      comments: []
    };

    this._refreshToken();
    this._checkEvents();
  }

  /**
   * Issues a Ruqqus API request.
   * 
   * @param {Object} options The request parameters.
   * @param {String} options.type The request method.
   * @param {String} options.path The request endpoint.
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

    let resp = await needle(options.type, options.path.startsWith("https://ruqqus.com/") ? options.path : `https://ruqqus.com/api/v1/${options.path.toLowerCase()}`, options.options || {}, { 
      user_agent: Client.userAgent, 
      headers: { 
        Authorization: `Bearer ${Client.keys.refresh.access_token}`, 
        "X-User-Type": "Bot",
        "X-Library": "ruqqus-js",
        "X-Supports": "auth",
      } });

    if (resp.body.error && resp.body.error.startsWith("405")) {
      new OAuthError({
        message: "Method Not Allowed",
        code: 405
      }); return;
    }
    
    return resp.body;
  }
  
  _refreshToken() {
    if (!config.get()) {
      config.regenerate();
    } else if (config.get("autosave") === true && config.get("refresh") && config.get("refresh") != " ") {
      Client.keys.refresh.refresh_token = config.get("refresh");
    }

    Client.APIRequest({ type: "POST", path: "https://ruqqus.com/oauth/grant", options: Client.keys.refresh.refresh_token ? Client.keys.refresh : Client.keys.code })
      .then(async (resp) => {
        if (resp.oauth_error) {
          let type;

          if (resp.oauth_error.startsWith("Invalid refresh_token")) {
            type = "Refresh Token";
          } else if (resp.oauth_error.startsWith("Invalid code")) {
            type = "Authcode";
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

        if (config.get("autosave") === true && resp.refresh_token) {
          config.set("refresh", resp.refresh_token);
        }

        Client.keys.refresh.refresh_token = resp.refresh_token || null;
        Client.keys.refresh.access_token = resp.access_token;
        let refreshIn = (resp.expires_at - 5) * 1000 - Date.now()
        
        console.log(`${chalk.greenBright("SUCCESS!")} Token Acquired!\nNext refresh in: ${chalk.yellow(`${Math.floor(refreshIn / 1000)} seconds`)} ${chalk.blueBright(`(${new Date((resp.expires_at - 10) * 1000).toLocaleTimeString("en-US")})`)}`);
        setTimeout(() => { this._refreshToken() }, refreshIn);

        if (!this.online) {
          if (Client.scopes.identity) {
            this.user.data = await this.user.fetchData();
          } else {
            this.user.data = undefined;
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

          resp.data.forEach(async post => {
            if (this.cache.posts.indexOf(post.id) > -1) return;
            this.cache.posts.push(post.id);
            
            if (this.cache._postCount != 0) {
              const Post = require("./post.js");
              this.emit("post", new Post(post.id), await Post.formatData(post));
            }
          });

          this.cache._postCount++;
        });
    }

    if (this.eventNames().includes("comment")) {
      if (!Client.scopes.read) return;
      
      Client.APIRequest({ type: "GET", path: "front/comments", options: { sort: "new" } })
        .then((resp) => {
          if (resp.error) return;

          resp.data.forEach(async comment => {
            if (this.cache.comments.indexOf(comment.id) > -1) return;
            this.cache.comments.push(comment.id);
            
            if (this.cache._commentCount != 0) {
              const Comment = require("./comment.js");
              this.emit("comment", new Comment(comment.id), await Comment.formatData(comment));
            }
          });

          this.cache._commentCount++;
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

  user = {
    data: {},

    /**
     * Fetches the data from the Client user.
     * 
     * @returns {Object} The user data.
     */

    async fetchData() {
      if (!Client.scopes.identity) {
        new OAuthError({
          message: 'Missing "Identity" Scope',
          code: 401
        }); return;
      }

      let resp = await Client.APIRequest({ type: "GET", path: "identity" });
      let data = (require("./user.js")).formatData(resp);

      this.data = data;
      return data;
    }
  }
  
  guilds = {
    /**
     * Gets a guild with the specified name.
     * 
     * @param {String} name The guild name.
     * @returns {Guild}
     */

    get(name) {
      return new (require("./guild.js"))(name);
    },

    /**
     * Fetches the data from a guild with the specified name.
     * 
     * @param {String} name The guild name.
     * @returns {Object} The guild data.
     */

    async fetchData(name) {
      if (!Client.scopes.read) {
        new OAuthError({
          message: 'Missing "Read" Scope',
          code: 401
        }); return;
      }

      return await new (require("./guild.js"))(name)._fetchData();
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
     * Gets a post with the specified ID.
     * 
     * @param {String} id The post ID.
     * @returns {Post}
     */

    get(id) {
      return new (require("./post.js"))(id);
    },

    /**
     * Fetches the data from a post with the specified ID.
     * 
     * @param {String} id The post ID.
     * @returns {Object} The post data.
     */

    async fetchData(id) {
      if (!Client.scopes.read) {
        new OAuthError({
          message: 'Missing "Read" Scope',
          code: 401
        }); return;
      }

      return await new (require("./post.js"))(id)._fetchData();
    }
  }

  comments = {
    /**
     * Gets a comment with the specified ID.
     * 
     * @param {String} id The comment ID.
     * @returns {Comment}
     */

    get(id) {
      return new (require("./comment.js"))(id);
    },

    /**
     * Fetches the data from a comment with the specified ID.
     * 
     * @param {String} id The comment ID. 
     * @returns {Object} The post data.
     */

    async fetchData(id) {
      if (!Client.scopes.read) {
        new OAuthError({
          message: 'Missing "Read" Scope',
          code: 401
        }); return;
      }

      return await new (require("./comment.js"))(id)._fetchData();
    }
  }

  users = {
    /**
     * Gets a user with the specified username.
     * 
     * @param {String} username The user's name.
     * @returns {User}
     */

    get(username) {
      return new (require("./user.js"))(username);
    },

    /**
     * Fetches the data from a user with the specified username.
     * 
     * @param {String} username The user's name.
     * @returns {Object} The user data.
     */

    async fetchData(username) {
      if (!Client.scopes.read) {
        new OAuthError({
          message: 'Missing "Read" Scope',
          code: 401
        }); return;
      }

      return await new (require("./user.js"))(username)._fetchData();
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