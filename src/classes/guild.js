const Client = require("./client.js");
const { OAuthWarning, OAuthError } = require("./error.js");

class GuildBase {  
  /**
   * Submits a post to the guild.
   * 
   * @param {String} title The title of the post.
   * @param {Object} options The post parameters.
   * @param {String} [body] The body of the post. Can include HTML and Markdown.
   * @param {String} [url] The post URL.
   * @param {Boolean} [nsfw=false] Whether or not the post should be marked as NSFW.
   */

  post(title, options) {
    if (!Client.scopes.create) {
      new OAuthError({
        message: 'Missing "Create" Scope',
        code: 401
      }); return;
    }

    if (!title || title == " ") {
      new OAuthError({
        message: "No Post Title Provided!",
        code: 405
      }); return;
    }

    if (!options || ((!options.body || options.body == " ") && (!options.url || options.url == " "))) {
      new OAuthError({
        message: "No Post Body or URL Provided!",
        code: 405
      }); return;
    }

    Client.APIRequest({ type: "POST", path: "submit", options: { board: this.name, title: title, ...options || {} } })
      .then((resp) => {
        if (!resp.guild_name == "general" && this.name.toLowerCase() != "general") new OAuthWarning({
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

  /**
   * Fetches an array of post objects from the guild.
   * 
   * @param {Object} [options] The post sorting parameters.
   * @param {String} [options.sort=new] The post sorting method.
   * @param {Number} [options.page=1] The page index to fetch posts from.
   * @param {String} [options.filter=all] The post filter method.
   * @param {Array} [options.timeframe=[0, 0]] The UTC timeframe in which to fetch posts from.
   * @param {Number} [options.limit=24] The amount of post objects to return.
   * @returns {Array} The post objects.
   */

  async fetchPosts(options) {
    const { Post } = require("./post.js");

    if (!Client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let posts = [];
    let resp = await Client.APIRequest({ type: "GET", path: `guild/${this.name}/listing`, options: options ? { 
      sort: options.sort || "new", 
      page: options.page || 1, 
      t: options.filter || "all", 
      utc_greater_than: options.timeframe && options.timeframe[0] || 0,
      utc_less_than: options.timeframe && options.timeframe[1] || 0
    } : {} });

    if (options && options.limit) resp.data.splice(options.limit, resp.data.length - options.limit);
    
    for await (let post of resp.data) {
      posts.push(new Post(post));
    }

    return posts;
  }

  /**
   * Fetches an array of comment objects from the guild.
   * 
   * @param {Object} [options] The post sorting parameters.
   * @param {Number} [options.page=1] The page index to fetch comments from.
   * @param {Number} [options.limit=24] The amount of comment objects to return.
   * @returns {Array} The comment objects.
   */

  async fetchComments(options) {
    const { Comment } = require("./comment.js");

    if (!Client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let comments = [];

    let resp = await Client.APIRequest({ type: "GET", path: `guild/${this.name}/comments`, options: { page: options && options.page ? options.page : 1 } });
    if (options && options.limit) resp.data.splice(options.limit, resp.data.length - options.limit);
    
    for await (let comment of resp.data) {
      comments.push(new Comment(comment));
    }

    return comments;
  }
}

class Guild extends GuildBase {
  constructor(data) {
    super();
    Object.assign(this, Guild.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;

    return {
      name: resp.name,
      description: {
        text: resp.description,
        html: resp.description_html
      },
      color: resp.color,
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      subscribers: resp.subscriber_count,
      guildmasters: resp.guildmasters.map(mod => {
        return new (require("./user.js")).UserCore(mod);
      }),
      icon_url: resp.profile_url.startsWith("/assets") ? `https://ruqqus.com/${resp.profile_url}` : resp.profile_url,
      banner_url: resp.banner_url.startsWith("/assets") ? `https://ruqqus.com/${resp.banner_url}` : resp.banner_url,
      created_at: resp.created_utc,
      flags: {
        banned: resp.is_banned,
        private: resp.is_private,
        restricted: resp.is_restricted,
        age_restricted: resp.over_18,
        siege_protected: resp.is_siege_protected
      }
    }
  }
}

class GuildCore extends GuildBase {
  constructor(data) {
    super();
    Object.assign(this, GuildCore.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;

    return {
      name: resp.name,
      description: {
        text: resp.description,
        html: resp.description_html
      },
      color: resp.color,
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      icon_url: resp.profile_url.startsWith("/assets") ? `https://ruqqus.com/${resp.profile_url}` : resp.profile_url,
      banner_url: resp.banner_url.startsWith("/assets") ? `https://ruqqus.com/${resp.banner_url}` : resp.banner_url,
      created_at: resp.created_utc,
      flags: {
        banned: resp.is_banned,
        private: resp.is_private,
        restricted: resp.is_restricted,
        age_restricted: resp.over_18,
        siege_protected: resp.is_siege_protected
      }
    }
  }
}

module.exports = { GuildBase, Guild, GuildCore };