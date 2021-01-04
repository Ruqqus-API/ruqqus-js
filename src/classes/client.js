const { EventEmitter } = require("events");

const { GuildManager } = require("./guild.js");
const { PostManager } = require("./post.js");
const { CommentManager } = require("./comment.js");
const { User, BannedUser, DeletedUser, UserManager } = require("./user.js");

const APIRequest = require("../util/api-request.js");
const Config = require("../util/config.js");
const { ScopeError, RuqqusAPIError } = require("./error.js");

class Client extends EventEmitter {
  /**
   * Creates a new ruqqus-js Client instance.
   * 
   * @param {Object} [options] The client options.
   * @param {String} [options.path] Path to a config file.
   * @param {String} [options.agent] Custom `user_agent`.
   * @param {String} [options.server] Custom API server.
   * @param {Function} [options.api_method] `Client.APIRequest` overload.
   * @constructor
   */

  constructor(options) {
    super();

    if (!options) options = {};
    if (options.path) this.config = new Config(options.path);

    this.user_agent = options.agent || this.config.get("agent") || `ruqqus-js@${options.id}`;

    this.start_time = 0;
    this.online = false,
    this.user = undefined;

    this.scopes = {
      identity: false,
      create: false,
      read: false,
      update: false,
      delete: false,
      vote: false,
      guildmaster: false
    };

    this._timeouts = new Set();
    this._api_method = options.api_method || null;
    this._server = options.server || null;
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

  async APIRequest(options) {
    if (this._api_method) {
      return await this._api_method(options, this);
    } else {
      if (this._server) options.server = this._server;
      return await APIRequest(options, this);
    }
  }
  
  _refreshToken() {
    require("../util/tokens.js")(this.keys.refresh.refresh ? this.keys.refresh : this.keys.code)
      .then(async resp => {
        resp.scopes.split(",").forEach(s => {
          this.scopes[s] = true;
        });

        if (this.config && this.config.get("autosave") === true && (!this.config.get("refresh") || this.config.get("refresh") == " ") && resp.refresh_token) {
          this.config.set("refresh", resp.refresh_token);
        }

        this.keys.refresh.refresh = resp.refresh_token || null;
        this.keys.refresh.access_token = resp.access_token;
        
        const timer = setTimeout(() => { this._refreshToken() }, (resp.expires_at * 1000) - Date.now());
        this._timeouts.add(timer);

        if (!this.online) {
          if (this.scopes.identity) {
            let user = await this.APIRequest({ type: "GET", path: "identity" });
            this.user = user.is_banned ? new BannedUser(user) : user.is_deleted ? new DeletedUser(user) : new User(user, this);
          } else {
            throw new ScopeError(`Missing "identity" scope; user data ignored`);
          }

          this.start_time = Date.now();
          this.emit("login");
          this.online = true;
        }
      }).catch(e => {
        console.error(e);
        process.exit();
      });
  }

  _checkEvents() {
    // TODO: Websocket events

    if (this.eventNames().includes("post") || this.eventNames().includes("comment")) {
      const timer = setTimeout(() => { this._checkEvents() }, 10000);
      this._timeouts.add(timer);
    }
    
    if (this.eventNames().includes("post") && this.scopes.read) {
      this.guilds.all.fetchPosts({ cache: false, ignore_pinned: true })
        .then(posts => {
          try {
            posts.forEach(async post => {
              if (this.posts.cache.get(post.id)) return;              
              if (this.posts.cache._count != 0) this.emit("post", post);
            });

            this.posts.cache.add(posts);
          } catch (e) { }

          this.posts.cache._count++;
        });
    }

    if (this.eventNames().includes("comment") && this.scopes.read) {      
      this.guilds.all.fetchComments({ cache: false })
        .then(comments => {
          try {
            comments.forEach(async comment => {
              if (this.comments.cache.get(comment.id)) return;
              if (this.comments.cache._count != 0) this.emit("comment", comment);
            });

            this.comments.cache.add(comments);
          } catch (e) { }

          this.comments.cache._count++;
        });
    }
  }

  _close(path) {
    if (!this.online) throw new RuqqusAPIError("Cannot destroy an offline client");

    this.APIRequest({ type: "POST", path })
      .then(resp => { 
        for (const t of this._timeouts) clearTimeout(t);
        this._timeouts.clear();
        this.keys = null;
      });
  }

  /**
   * The amount of time that has passed since Client login.
   * 
   * @returns {Number} The time, in seconds.
   */

  get uptime() {
    return Math.floor((Date.now() - this.start_time) / 1000);
  }
  
  guilds = new GuildManager(this)
  posts = new PostManager(this)
  comments = new CommentManager(this)
  users = new UserManager(this)

  /**
   * Logs into Ruqqus as a user.
   * 
   * @param {Object} keys The Application parameters, including the authorization code.
   * @param {String} keys.id The Application ID. 
   * @param {String} keys.token The Application secret.
   * @param {String} keys.code The one-time use authorization code.
   * @param {String} [keys.refresh] The refresh token. Overrides authorization code.
   */

  login(keys) {
    if (this.online) throw new RuqqusAPIError("Client is already online");

    if (!keys) keys = {};
    let cfg = this.config ? this.config.get() : null;

    keys = cfg ? {
      id: keys.id || cfg.id || "",
      token: keys.token || cfg.token || "",
      code: keys.code || "",
      refresh: keys.refresh || cfg.refresh || null,
    } : keys;

    this.keys = {
      code: {
        id: keys.id,
        token: keys.token,
        type: "code",
        code: keys.code,
      },
      refresh: {
        id: keys.id,
        token: keys.token,
        type: "refresh",
        refresh: keys.refresh || null,
        access_token: ""
      }
    };

    this._refreshToken();
    this._checkEvents();
  }

  /**
   * Logs out and terminates access to the user.
   */

  destroy() {
    this._close("release");
  } 

  /**
   * Terminates access to the user and permanently destroys both the refresh and access tokens.
   */

  kill() {
    this._close("kill");
  }
}

module.exports = Client;