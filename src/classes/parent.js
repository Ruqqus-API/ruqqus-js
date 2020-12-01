const Comment = require("./comment.js");

class ParentComment extends Comment {
  constructor(data) {
    super(null, true);

    Object.assign(this, ParentComment.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      author_username: resp.author_name, // This is ridiculous.
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
        edited: resp.edited_utc > 0
      }
    }
  }
}

module.exports = ParentComment;