const Client = require("./client.js");
const { OAuthError } = require("./error.js");

class CommentBase {
  /**
   * Submits a reply to the comment.
   * 
   * @param {String} body The body of the reply.
   */

  reply(body) {
    if (!Client.scopes.create) {
      new OAuthError({
        message: 'Missing "Create" Scope',
        code: 401
      }); return;
    }

    if (!body || body == " ") {
      new OAuthError({
        message: "No Comment Body Provided!",
        code: 405
      }); return;
    }

    Client.APIRequest({ type: "POST", path: "comment", options: { parent_fullname: `t3_${this.id}`, body: body } });
  }

  /**
   * Upvotes the comment.
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
    
    Client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/1` });
  }

  /** 
   * Downvotes the comment.
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

    Client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/-1` });
  }

  /**
   * Removes the client's vote from the comment.
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
    
    Client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/0` });
  }

  /**
   * Deletes the comment.
   */

  delete() {
    if (!Client.scopes.delete) {
      new OAuthError({
        message: 'Missing "Delete" Scope',
        code: 401
      }); return;
    }

    Client.APIRequest({ type: "POST", path: `delete/comment/${this.id}` })
      .then((resp) => {
        if (resp.error) new OAuthError({
          message: "Comment Deletion Failed",
          code: 403
        });
      });
  }
}

class Comment extends CommentBase {
  constructor(data) {
    super();
    Object.assign(this, Comment.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      author: new (require("./user")).UserCore(resp.author),
      content: {
        text: resp.body,
        html: resp.body_html
      },
      votes: {
        score: resp.score,
        upvotes: resp.upvotes,
        downvotes: resp.downvotes
      },
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      parent: new CommentCore(resp.parent),
      created_at: resp.created_utc,
      edited_at: resp.edited_utc,
      chain_level: resp.level,
      awards: resp.award_count,
      flags: {
        archived: resp.is_archived,
        banned: resp.is_banned,
        deleted: resp.is_deleted,
        nsfw: resp.is_nsfw,
        nsfl: resp.is_nsfl,
        offensive: resp.is_offensive,
        bot: resp.is_bot,
        edited: resp.edited_utc > 0
      },
      post: new (require("./post.js")).PostCore(resp.post),
      guild: new (require("./guild.js")).GuildCore(resp.guild)
    }
  }
}

class CommentCore extends CommentBase {
  constructor(data) {
    super();
    Object.assign(this, CommentCore.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      author_name: resp.author_name,
      content: {
        text: resp.body,
        html: resp.body_html
      },
      votes: {
        score: resp.score,
        upvotes: resp.upvotes,
        downvotes: resp.downvotes
      },
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      parent_id: resp.parent_comment_id,
      created_at: resp.created_utc,
      edited_at: resp.edited_utc,
      chain_level: resp.level,
      awards: resp.award_count,
      flags: {
        archived: resp.is_archived,
        banned: resp.is_banned,
        deleted: resp.is_deleted,
        nsfw: resp.is_nsfw,
        nsfl: resp.is_nsfl,
        offensive: resp.is_offensive,
        bot: resp.is_bot,
        edited: resp.edited_utc > 0
      }
    }
  }
}

module.exports = { CommentBase, Comment, CommentCore };