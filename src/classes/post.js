const Client = require("./client.js");
const { OAuthError } = require("./error.js");

class Post {
  constructor(data) {
    Object.assign(this, Post.formatData(data));
  }
  
  static formatData(resp) {
    if (!resp.id) return undefined;

    return {
      author: new (require("./user.js"))(resp.author),
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
        edited: resp.edited_utc > 0,
        yanked: resp.original_guild ? true : false
      },
      guild: new (require("./guild.js"))(resp.guild),
      original_guild: resp.original_guild ? new (require("./guild.js"))(resp.original_guild) : null
    }
  }

  /**
   * Submits a comment to the post.
   * 
   * @param {String} body The body of the comment.
   */

  comment(body) {
    if (!Client.scopes.create) { 
      new OAuthError({
        message: 'Missing "Create" Scope',
        code: 401
      }); return;
    }

    if (!body || body == " ") return new OAuthError({
      message: "No Comment Body Provided!",
      code: 405
    });

    Client.APIRequest({ type: "POST", path: "comment", options: { parent_fullname: `t2_${this.id}`, body: body } });
  }

  /**
   * Upvotes the post.
   * 
   * @deprecated
   */

  upvote() {
    if (!Client.scopes.vote) { 
      new OAuthError({
        message: 'Missing "Vote" Scope',
        code: 401
      }); return;
    }

    Client.APIRequest({ type: "POST", path: `vote/post/${this.id}/1` });
  }
  
  /**
   * Downvotes the post.
   * 
   * @deprecated
   */

  downvote() {
    if (!Client.scopes.vote) {
      new OAuthError({
        message: 'Missing "Vote" Scope',
        code: 401
      }); return;
    }

    Client.APIRequest({ type: "POST", path: `vote/post/${this.id}/-1` });
  }

  /**
   * Removes the client's vote from the post.
   * 
   * @deprecated
   */

  removeVote() {
    if (!Client.scopes.vote) {
      new OAuthError({
        message: 'Missing "Vote" Scope',
        code: 401
      }); return;
    }

    Client.APIRequest({ type: "POST", path: `vote/post/${this.id}/0` });
  }

  /**
   * Deletes the post.
   */

  delete() {
    if (!Client.scopes.delete) {
      new OAuthError({
        message: 'Missing "Delete" Scope',
        code: 401 
      }); return;
    }
    
    Client.APIRequest({ type: "POST", path: `delete_post/${this.id}` })
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
    if (!Client.scopes.update) {
      new OAuthError({
        message: 'Missing "Update" Scope',
        code: 401 
      }); return;
    }

    Client.APIRequest({ type: "POST", path: `toggle_post_nsfw/${this.id}` })
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
    if (!Client.scopes.update) {
      new OAuthError({
        message: 'Missing "Update" Scope',
        code: 401 
      }); return;
    }

    Client.APIRequest({ type: "POST", path: `toggle_post_nsfl/${this.id}` })
      .then((resp) => {
        if (resp.error) new OAuthError({
          message: "Post Update Failed",
          code: 403
        });
      });
  }
}

module.exports = Post;