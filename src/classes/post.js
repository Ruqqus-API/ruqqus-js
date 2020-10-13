const { OAuthError } = require("./error.js");

class Post {
  constructor(id, client) {
    this.id = id;
    this.client = client;
  }
  
  async _fetchData(format) {
    let resp = format || await this.client.APIRequest({ type: "GET", path: `post/${this.id}`, options: { sort: "top" } });

    if (!resp.id) return undefined;

    return {
      author: {
        username: resp.author,
        title: resp.author_title ? {
          name: resp.author_title.text.startsWith(",") ? resp.author_title.text.split(", ")[1] : resp.author_title.text,
          id: resp.author_title.id,
          kind: resp.author_title.kind,
          color: resp.author_title.color
        } : null
      },
      content: {
        title: resp.title,
        body: {
          text: resp.body,
          html: resp.body_html
        },
        domain: resp.domain,
        url: resp.url,
        thumbnail: resp.thumb_url,
        embed: resp.embed_url
      },
      votes: {
        score: resp.score,
        upvotes: resp.upvotes,
        downvotes: resp.downvotes,
        voted: resp.voted
      },
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      created_at: resp.created_utc,
      edited_at: resp.edited_utc,
      flags: {
        archived: resp.is_archived,
        banned: resp.is_banned,
        deleted: resp.is_deleted,
        nsfw: resp.is_nsfw,
        nsfl: resp.is_nsfl,
        edited: resp.edited_utc > 0
      },
      guild: {
        name: resp.guild_name,
        original_name: resp.original_guild_name
      }
    }
  }

  static formatData(format) {
    return new Post()._fetchData(format);
  }

  /**
   * Submits a comment to the post.
   * 
   * @param {String} body The body of the comment.
   */

  comment(body) {
    if (!this.client.scopes.create) { 
      new OAuthError({
        message: 'Missing "Create" Scope',
        code: 401
      }); return;
    }

    if (!body || body == " ") return new OAuthError({
      message: "No Comment Body Provided!",
      code: 405
    });

    this.client.APIRequest({ type: "POST", path: "comment", options: { parent_fullname: `t2_${this.id}`, body: body } });
  }

  /**
   * Upvotes the post.
   */

  upvote() {
    if (!this.client.scopes.vote) { 
      new OAuthError({
        message: 'Missing "Vote" Scope',
        code: 401
      }); return;
    }

    this.client.APIRequest({ type: "POST", path: `vote/post/${this.id}/1` });
  }
  
  /**
   * Downvotes the post.
   */

  downvote() {
    if (!this.client.scopes.vote) {
      new OAuthError({
        message: 'Missing "Vote" Scope',
        code: 401
      }); return;
    }

    this.client.APIRequest({ type: "POST", path: `vote/post/${this.id}/-1` });
  }

  /**
   * Removes the client's vote from the post.
   */

  removeVote() {
    if (!this.client.scopes.vote) {
      new OAuthError({
        message: 'Missing "Vote" Scope',
        code: 401
      }); return;
    }

    this.client.APIRequest({ type: "POST", path: `vote/post/${this.id}/0` });
  }

  /**
   * Deletes the post.
   */

  delete() {
    if (!this.client.scopes.delete) {
      new OAuthError({
        message: 'Missing "Delete" Scope',
        code: 401 
      }); return;
    }
    
    this.client.APIRequest({ type: "POST", path: `delete_post/${this.id}` })
      .then((resp) => {
        if (resp.error) new OAuthError({
          message: "Post Deletion Failed",
          code: 403
        });
      });
  }

  /**
   * Toggles post NSFW.
   */

  toggleNSFW() {
    if (!this.client.scopes.update) {
      new OAuthError({
        message: 'Missing "Update" Scope',
        code: 401 
      }); return;
    }

    this.client.APIRequest({ type: "POST", path: `toggle_post_nsfw/${this.id}` })
      .then((resp) => {
        if (resp.error) new OAuthError({
          message: "Post Update Failed",
          code: 403
        });
      });
  }

  /**
   * Toggles post NSFL.
   */

  toggleNSFL() {
    if (!this.client.scopes.update) {
      new OAuthError({
        message: 'Missing "Update" Scope',
        code: 401 
      }); return;
    }

    this.client.APIRequest({ type: "POST", path: `toggle_post_nsfl/${this.id}` })
      .then((resp) => {
        if (resp.error) new OAuthError({
          message: "Post Update Failed",
          code: 403
        });
      });
  }
}

module.exports = Post;