/*
*                                                            d8b                .d8888b.       .d8888b.  
*                                                            Y8P               d88P  Y88b     d88P  Y88b 
*                                                                                     888     888    888 
888d888 888  888  .d88888  .d88888 888  888 .d8888b         8888 .d8888b            .d88P     888    888 
888P"   888  888 d88" 888 d88" 888 888  888 88K             "888 88K            .od888P"      888    888 
888     888  888 888  888 888  888 888  888 "Y8888b. 888888  888 "Y8888b.      d88P"          888    888 
888     Y88b 888 Y88b 888 Y88b 888 Y88b 888      X88         888      X88      888"       d8b Y88b  d88P 
888      "Y88888  "Y88888  "Y88888  "Y88888  88888P'         888  88888P'      888888888  Y8P  "Y8888P"  
*                     888      888                           888                                         
*                     888      888                          d88P                                         
*                     888      888                        888P"                                          
*/

const needle = require("needle");
const chalk = require("chalk");
const { EventEmitter } = require("events");

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
      _commentCount: 0,
      posts: [],
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
   * @returns {Object} The request response.
   */
  
  static async APIRequest(options) {
    let methods = [ "GET", "POST" ];
    if (!options.type || !options.path || !methods.includes(options.type.toUpperCase())) {
      new OAuthError({
        message: "Invalid Request",
        code: 405
      }); return;
    }

    let resp = await needle(options.type, options.path.startsWith("https://ruqqus.com/") ? options.path : `https://ruqqus.com/api/v1/${options.path.toLowerCase()}`, options.options || {}, { user_agent: Client.userAgent, headers: { Authorization: `Bearer ${Client.keys.refresh.access_token}` } });

    if (resp.body.error && resp.body.error.startsWith("405")) {
      new OAuthError({
        message: "Method Not Allowed",
        code: 405
      }); return;
    }
    
    return resp;
  }
  
  _refreshToken() {
    Client.APIRequest({ type: "POST", path: "https://ruqqus.com/oauth/grant", options: Client.keys.refresh.refresh_token ? Client.keys.refresh : Client.keys.code })
      .then(async (resp) => {
        if (resp.body.oauth_error) {
          let type;

          if (resp.body.oauth_error.startsWith("Invalid refresh_token")) {
            type = "Refresh Token";
          } else if (resp.body.oauth_error.startsWith("Invalid code")) {
            type = "Authcode";
          }

          return new OAuthError({
            message: `Invalid ${type}`,
            code: 401,
            fatal: true
          });
        }

        resp.body.scopes.split(",").forEach(s => {
          Client.scopes[s] = true;
        });

        Client.keys.refresh.refresh_token = resp.body.refresh_token || null;
        Client.keys.refresh.access_token = resp.body.access_token;
        let refreshIn = (resp.body.expires_at - 5) * 1000 - Date.now()
        
        console.log(`${chalk.greenBright("SUCCESS!")} Token Acquired!\nNext refresh in: ${chalk.yellow(`${Math.floor(refreshIn / 1000)} seconds`)} ${chalk.blueBright(`(${new Date((resp.body.expires_at - 10) * 1000).toLocaleTimeString("en-US")})`)}`);
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

          if (!Client.scopes.read) new OAuthWarning({
            message: 'Missing "Read" Scope',
            warning: "Post and Comment events will not be emitted!"
          });

          this.emit("login");
          this.online = true;
          this.startTime = Date.now();
        }
      }).catch(e => console.error(e));
  }

  _checkEvents() {
    setTimeout(() => { this._checkEvents() }, 10000);
    
    if (this.eventNames().includes("post")) {
      if (!Client.scopes.read) return;

      Client.APIRequest({ type: "GET", path: "all/listing", options: { sort: "new" } })
        .then((resp) => {
          if (resp.body.error) return;

          resp.body.data.forEach(async (post, i) => {
            if (this.cache.posts.indexOf(post.id) > -1) return;
            this.cache.posts.push(post.id);
            
            if (this.cache._postCount != 0) {
              let postData = await new Post(post.id)._fetchData();
              this.emit("post", new Post(post.id), postData);
            }
          });

          this.cache._postCount++;
        });
    }

    if (this.eventNames().includes("comment")) {
      if (!Client.scopes.read) return;
      
      Client.APIRequest({ type: "GET", path: "front/comments", options: { sort: "new" } })
        .then((resp) => {
          if (resp.body.error) return;

          resp.body.data.forEach(async (comment, i) => {
            if (this.cache.comments.indexOf(comment.id) > -1) return;
            this.cache.comments.push(comment.id);
            
            if (this.cache._commentCount != 0) {
              let commentData = await new Comment(comment.id)._fetchData();
              this.emit("comment", new Comment(comment.id), commentData);
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

  uptime() {
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
      let data = await new User(resp.body.username)._fetchData();

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
      return new Guild(name);
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

      return await new Guild(name)._fetchData();
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

      return resp.body.available;
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
      return new Post(id);
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

      return await new Post(id)._fetchData();
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
      return new Comment(id);
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

      return await new Comment(id)._fetchData();
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
      return new User(username);
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

      return await new User(username)._fetchData();
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

      return Object.values(resp.body)[0];
    }
  }
}

class Guild {
  constructor(name) {
    this.name = name;
  }

  async _fetchData() {
    let resp = await Client.APIRequest({ type: "GET", path: `guild/${this.name}` });

    if (!resp.body.id) return undefined;

    return {
      name: resp.body.name,
      description: {
        text: resp.body.description,
        html: resp.body.description_html
      },
      color: resp.body.color,
      id: resp.body.id,
      full_id: resp.body.fullname,
      link: resp.body.permalink,
      full_link: `https://ruqqus.com${resp.body.permalink}`,
      subscribers: resp.body.subscriber_count,
      guildmasters: resp.body.mods_count,
      icon_url: resp.body.profile_url.startsWith("/assets") ? `https://ruqqus.com/${resp.body.profile_url}` : resp.body.profile_url,
      banner_url: resp.body.banner_url.startsWith("/assets") ? `https://ruqqus.com/${resp.body.banner_url}` : resp.body.banner_url,
      created_at: resp.body.created_utc,
      flags: {
        banned: resp.body.is_banned,
        private: resp.body.is_private,
        restricted: resp.body.is_restricted,
        age_restricted: resp.body.over_18
      }
    }
  }
  
  /**
   * Submits a post to the guild.
   * 
   * @param {String} title The title of the post.
   * @param {String} body The body of the post. Can include HTML and Markdown.
   */

  post(title, body) {
    if (!Client.scopes.create) return new OAuthError({
      message: 'Missing "Create" Scope',
      code: 401
    });

    if (!title || title == " ") return new OAuthError({
      message: "No Post Title Provided!",
      code: 405
    });

    if (!body || body == " ") return new OAuthError({
      message: "No Post Body Provided!",
      code: 405
    });

    Client.APIRequest({ type: "POST", path: "submit", options: { board: this.name, title: title, body: body } })
      .then((resp) => {
        if (!resp.body.guild_name == "general" && this.name.toLowerCase() != "general") new OAuthWarning({
          message: "Invalid Guild Name",
          warning: "Post submitted to to +general!"
        });
      });
  }

  /**
   * Fetches an array of post objects from the guild.
   * 
   * @param {String} [sort=new] The post sorting method.
   * @param {Number} [limit=24] The amount of post objects to return.
   * @param {Number} [page=1] The page index to fetch posts from.
   * @returns {Array} The post objects.
   */

  async fetchPosts(sort, limit, page) {
    if (!Client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let posts = [];
    let resp = await Client.APIRequest({ type: "GET", path: `guild/${this.name}/listing`, options: { sort: sort || "new", page: page || 1 } });
    if (limit) resp.body.data.splice(limit, resp.body.data.length - limit);
    
    for await (let post of resp.body.data) {
      posts.push(await new Post(post.id)._fetchData());
    }

    return posts;
  }

  /**
   * Fetches an array of comment objects from the guild.
   * 
   * @param {Number} [limit=24] The amount of comment objects to return.
   * @param {Number} [page=1] The page index to fetch comments from.
   * @returns {Array} The comment objects.
   */

  async fetchComments(limit, page) {
    if (!Client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let comments = [];

    let resp = await Client.APIRequest({ type: "GET", path: `guild/${this.name}/comments`, options: { page: page || 1 } });
    if (limit) resp.body.data.splice(limit, resp.body.data.length - limit);
    
    for await (let comment of resp.body.data) {
      comments.push(await new Comment(comment.id)._fetchData());
    }

    return comments;
  }
}

class Post {
  constructor(id) {
    this.id = id;
  }
  
  async _fetchData() {
    let resp = await Client.APIRequest({ type: "GET", path: `post/${this.id}`, options: { sort: "top" } });

    if (!resp.body.id) return undefined;

    return {
      author: {
        username: resp.body.author,
        title: resp.body.author_title ? {
          name: resp.body.author_title.text.startsWith(",") ? resp.body.author_title.text.split(", ")[1] : resp.body.author_title.text,
          id: resp.body.author_title.id,
          kind: resp.body.author_title.kind,
          color: resp.body.author_title.color
        } : null
      },
      content: {
        title: resp.body.title,
        body: {
          text: resp.body.body,
          html: resp.body.body_html
        },
        domain: resp.body.domain,
        url: resp.body.url,
        thumbnail: resp.body.thumb_url,
        embed: resp.body.embed_url
      },
      votes: {
        score: resp.body.score,
        upvotes: resp.body.upvotes,
        downvotes: resp.body.downvotes,
        voted: resp.body.voted
      },
      id: resp.body.id,
      full_id: resp.body.fullname,
      link: resp.body.permalink,
      full_link: `https://ruqqus.com${resp.body.permalink}`,
      created_at: resp.body.created_utc,
      edited_at: resp.body.edited_utc,
      flags: {
        archived: resp.body.is_archived,
        banned: resp.body.is_banned,
        deleted: resp.body.is_deleted,
        nsfw: resp.body.is_nsfw,
        nsfl: resp.body.is_nsfl,
        edited: resp.body.edited_utc > 0
      },
      guild: {
        name: resp.body.guild_name,
        original_name: resp.body.original_guild_name
      }
    }
  }

  /**
   * Submits a comment to the post.
   * 
   * @param {String} body The body of the comment.
   */

  comment(body) {
    if (!Client.scopes.create) return new OAuthError({
      message: 'Missing "Create" Scope',
      code: 401
    });

    if (!body || body == " ") return new OAuthError({
      message: "No Post Body Provided!",
      code: 405
    });

    Client.APIRequest({ type: "POST", path: "comment", options: { parent_fullname: `t2_${this.id}`, body: body } });
  }

  /**
   * Upvotes the post.
   */

  upvote() {
    if (!Client.scopes.vote) return new OAuthError({
      message: 'Missing "Vote" Scope',
      code: 401
    });

    Client.APIRequest({ type: "POST", path: `vote/post/${this.id}/1` });
  }
  
  /**
   * Downvotes the post.
   */

  downvote() {
    if (!Client.scopes.vote) return new OAuthError({
      message: 'Missing "Vote" Scope',
      code: 401
    });

    Client.APIRequest({ type: "POST", path: `vote/post/${this.id}/-1` });
  }

  /**
   * Removes the client's vote from the post.
   */

  removeVote() {
    if (!Client.scopes.vote) return new OAuthError({
      message: 'Missing "Vote" Scope',
      code: 401
    });

    Client.APIRequest({ type: "POST", path: `vote/post/${this.id}/0` });
  }

  /**
   * Deletes the post.
   */

  delete() {
    if (!Client.scopes.delete) return new OAuthError({
      message: 'Missing "Delete" Scope',
      code: 401 
    });
    
    Client.APIRequest({ type: "POST", path: `delete_post/${this.id}` })
      .then((resp) => {
        if (resp.body.error) new OAuthError({
          message: "Post Deletion Failed",
          code: 403
        });
      });
  }
}

class Comment {
  constructor(id) {
    this.id = id;
  }

  async _fetchData() {
    let resp = await Client.APIRequest({ type: "GET", path: `comment/${this.id}` });

    if (!resp.body.id) return undefined;
    
    return {
      author: {
        username: resp.body.author,
        title: resp.body.title ? {
          name: resp.body.title.text.startsWith(",") ? resp.body.title.text.split(", ")[1] : resp.body.title.text,
          id: resp.body.title.id,
          kind: resp.body.title.kind,
          color: resp.body.title.color
        } : null,
      },
      content: {
        text: resp.body.body,
        html: resp.body.body_html
      },
      votes: {
        score: resp.body.score,
        upvotes: resp.body.upvotes,
        downvotes: resp.body.downvotes
      },
      parent: {
        post: resp.body.post,
        comment: resp.body.parent.startsWith("t3") ? resp.body.parent : null
      },
      id: resp.body.id,
      full_id: resp.body.fullname,
      link: resp.body.permalink,
      full_link: `https://ruqqus.com${resp.body.permalink}`,
      created_at: resp.body.created_utc,
      edited_at: resp.body.edited_utc,
      chain_level: resp.body.level,
      flags: {
        archived: resp.body.is_archived,
        banned: resp.body.is_banned,
        deleted: resp.body.is_deleted,
        nsfw: resp.body.is_nsfw,
        nsfl: resp.body.is_nsfl,
        offensive: resp.body.is_offensive,
        edited: resp.body.edited_utc > 0
      },
      guild: resp.body.guild_name,
    }
  }

  /**
   * Submits a reply to the comment.
   * 
   * @param {String} body The body of the reply.
   */

  reply(body) {
    if (!Client.scopes.create) return new OAuthError({
      message: 'Missing "Create" Scope',
      code: 401
    });

    if (!body || body == " ") return new OAuthError({
      message: "No Post Body Provided!",
      code: 405
    });

    Client.APIRequest({ type: "POST", path: "comment", options: { parent_fullname: `t3_${this.id}`, body: body } });
  }

  /**
   * Upvotes the comment.
   */

  upvote() {
    if (!Client.scopes.vote) return new OAuthError({
      message: 'Missing "Vote" Scope',
      code: 401
    });
    
    Client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/1` });
  }

  /** 
   * Downvotes the comment.
   */

  downvote() {
    if (!Client.scopes.vote) return new OAuthError({
      message: 'Missing "Vote" Scope',
      code: 401
    });

    Client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/-1` });
  }

  /**
   * Removes the client's vote from the comment.
   */

  removeVote() {
    if (!Client.scopes.vote) return new OAuthError({
      message: 'Missing "Vote" Scope',
      code: 401
    });
    
    Client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/0` });
  }

  /**
   * Deletes the comment.
   */

  delete() {
    if (!Client.scopes.delete) return new OAuthError({
      message: 'Missing "Delete" Scope',
      code: 401
    });

    Client.APIRequest({ type: "POST", path: `delete/comment/${this.id}` })
      .then((resp) => {
        if (resp.body.error) new OAuthError({
          message: "Comment Deletion Failed",
          code: 403
        });
      });
  }
}

class User {
  constructor(username) {
    this.username = username;
  }

  async _fetchData() {
    let resp = await Client.APIRequest({ type: "GET", path: `user/${this.username}` });

    if (!resp.body.id) return undefined;

    if (resp.body.is_banned) {
      return {
        username: resp.body.username,
        id: resp.body.id,
        link: resp.body.permalink,
        full_link: `https://ruqqus.com${resp.body.permalink}`,
        ban_reason: resp.body.ban_reason,
      }
    }
    
    return {
      username: resp.body.username,
      title: resp.body.title ? {
        name: resp.body.title.text.startsWith(",") ? resp.body.title.text.split(", ")[1] : resp.body.title.text,
        id: resp.body.title.id,
        kind: resp.body.title.kind,
        color: resp.body.title.color
      } : null,
      bio: {
        text: resp.body.bio,
        html: resp.body.bio_html
      },
      stats: {
        posts: resp.body.post_count,
        post_rep: resp.body.post_rep,
        comments: resp.body.comment_count,
        comment_rep: resp.body.comment_rep
      },
      id: resp.body.id,
      full_id: `t1_${resp.body.id}`,
      link: resp.body.permalink,
      full_link: `https://ruqqus.com${resp.body.permalink}`,
      avatar_url: resp.body.profile_url.startsWith("/assets") ? `https://ruqqus.com${resp.body.profile_url}` : resp.body.profile_url,
      banner_url: resp.body.banner_url.startsWith("/assets") ? `https://ruqqus.com${resp.body.banner_url}` : resp.body.banner_url,
      created_at: resp.body.created_utc,
      flags: {
        banned: resp.body.is_banned
      },
      badges: 
        resp.body.badges.map(b => {
          return { 
            name: b.name,
            description: b.text,
            url: b.url,
            created_at: b.created_utc
          }
        }),
    }
  }

  /**
   * Fetches an array of post objects from the user.
   * 
   * @param {String} [sort=new] The post sorting method.
   * @param {Number} [limit=24] The amount of post objects to return.
   * @param {Number} [page=1] The page index to fetch posts from.
   * @returns {Array} The post objects.
   */

  async fetchPosts(sort, limit, page) {
    if (!Client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let posts = [];
    
    let resp = await Client.APIRequest({ type: "GET", path: `user/${this.username}/listing`, options: { sort: sort || "new", page: page || 1 } });
    if (limit) resp.body.data.splice(limit, resp.body.data.length - limit);
    
    for await (let post of resp.body.data) {
      posts.push(await new Post(post.id)._fetchData());
    }

    return posts;
  }

  /**
   * Fetches an array of comment objects from the user.
   * 
   * @param {Number} [limit=24] The amount of comment objects to return.
   * @param {Number} [page=1] The page index to fetch comments from.
   * @returns {Array} The comment objects.
   */

  async fetchComments(limit, page) {
    if (!Client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let comments = [];

    let resp = await Client.APIRequest({ type: "GET", path: `user/${this.username}/comments`, options: { page: page || 1 } });
    if (limit) resp.body.data.splice(limit, resp.body.data.length - limit);
    
    for await (let comment of resp.body.data) {
      comments.push(await new Comment(comment.id)._fetchData());
    }

    return comments;
  }
}

class OAuthWarning {
  /**
   * Creates and throws a new OAuth Warning.
   * 
   * @param {Object} options The Warning parameters.
   * @param {String} options.message The Warning message.
   * @param {String} options.warning The Warning consequence.
   * @constructor
   */

  constructor(options) {
    this.message = `${chalk.yellow("WARN!")} ${options.message} - ${chalk.yellow(options.warning || "")}`

    this.throw();
  }

  throw() {
    console.log(this.message);
  }
}

class OAuthError extends Error {
  /**
   * Creates and throws a new OAuth Error.
   * 
   * @param {Object} options The Error parameters.
   * @param {String} options.message The Error message.
   * @param {Number} options.code The Error code. Status messages are handled automatically.
   * @param {Boolean} options.fatal Whether or not the Error should be treated as fatal.
   * @constructor
   */

  constructor(options) {
    super(options);
    
    const codeStatuses = {
      401: "NOT_AUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      405: "NOT_ALLOWED",
      500: "INTERNAL_ERROR",
      503: "UNAVAILABLE"
    }

    this.message = `${chalk.red(options.fatal ? "FATAL ERR!" : "ERR!")} ${options.message} - ${chalk.yellow(`${options.code} ${codeStatuses[options.code] || ""}`)}`;

    this.error = options.message;
    this.code = options.code;
    this.status = codeStatuses[options.code];
    this.fatal = options.fatal || false;
  
    this.throw();
  }

  throw() {
    let stack = this.stack.split("\n").slice(1); 
    stack = stack.map((x, i) => {
      if (i == 0) return x;
      if (i == 1 && x.trim().startsWith("at Object")) return x;
      return chalk.gray(x);
    });

    console.log(this.message);
    console.log(stack.join("\n"));

    this.message = ""; this.stack = "";

    if (this.fatal) process.exit();
  }
}

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
  else if (typeof options.scopes == "string") scopes = options.scopes.split(",");
  else {
    new OAuthError({
      message: "Invalid Scope Parameter",
      code: 401
    }); return;
  } 

  scopes = scopes.filter(s => scopeList.includes(s)).map(s => {
    return s.toLowerCase();
  });

  if (!options.redirect) options.redirect = "undefined";

  return `https://ruqqus.com/oauth/authorize?client_id=${options.id}&redirect_uri=${options.redirect.startsWith("https://") ? options.redirect : `https://${options.redirect}`}&state=${options.state || "ruqqus-js"}&scope=${scopes}${options.permanent ? "&permanent=true" : ""}`;
}

module.exports = { Client, OAuthWarning, OAuthError, getAuthURL }