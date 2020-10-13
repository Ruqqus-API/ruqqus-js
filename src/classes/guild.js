const { OAuthWarning, OAuthError } = require("./error.js");

class Guild {
  constructor(name, client) {
    this.name = name;
    this.client = client;
  }

  async _fetchData(format) {
    let resp = format || await this.client.APIRequest({ type: "GET", path: `guild/${this.name}` });

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
      guildmasters: resp.mods_count,
      icon_url: resp.profile_url.startsWith("/assets") ? `https://ruqqus.com/${resp.profile_url}` : resp.profile_url,
      banner_url: resp.banner_url.startsWith("/assets") ? `https://ruqqus.com/${resp.banner_url}` : resp.banner_url,
      created_at: resp.created_utc,
      flags: {
        banned: resp.is_banned,
        private: resp.is_private,
        restricted: resp.is_restricted,
        age_restricted: resp.over_18
      }
    }
  }

  static formatData(format) {
    return new Guild()._fetchData(format);
  }
  
  /**
   * Submits a post to the guild.
   * 
   * @param {String} title The title of the post.
   * @param {String} body The body of the post. Can include HTML and Markdown.
   * @param {Object} [options] The post options.
   * @param {String} [options.url] The post URL.
   * @param {Boolean} [options.nsfw] Whether or not the post should be marked as NSFW.
   */

  post(title, body, options) {
    if (!this.client.scopes.create) {
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

    if (!body || body == " ") {
      new OAuthError({
        message: "No Post Body Provided!",
        code: 405
      }); return;
    }

    this.client.APIRequest({ type: "POST", path: "submit", options: { board: this.name, title: title, body: body, url: options.url || "", over_18: options.nsfw } })
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

  async fetchPosts(sort, limit, page) {
    const Post = require("./post.js");

    if (!this.client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let posts = [];
    let resp = await this.client.APIRequest({ type: "GET", path: `guild/${this.name}/listing`, options: { sort: sort || "new", page: page || 1 } });
    if (limit) resp.data.splice(limit, resp.data.length - limit);
    
    for await (let post of resp.data) {
      posts.push(await Post.formatData(post));
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
    const Comment = require("./comment.js");

    if (!this.client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let comments = [];

    let resp = await this.client.APIRequest({ type: "GET", path: `guild/${this.name}/comments`, options: { page: page || 1 } });
    if (limit) resp.data.splice(limit, resp.data.length - limit);
    
    for await (let comment of resp.data) {
      comments.push(await Comment.formatData(comment));
    }

    return comments;
  }
}

module.exports = Guild;