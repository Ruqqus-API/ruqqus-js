declare module "ruqqus-js" {
  import { EventEmitter } from "events";

  export class Client extends EventEmitter  {
    constructor(options?: ClientOptions);

    public config?: Config;
    public keys: ClientKeys;
    public scopes: Record<Scope, boolean>;
    public user_agent: string;
    public startTime: number;
    public online: boolean;
    private _timeouts: Set<any>;

    private _refreshToken(): void;
    private _checkEvents(): void;
    public get uptime(): number;
    public APIRequest(options: ClientAPIRequestOptions): Promise<object>;

    public user: User;
    public guilds: GuildManager;
    public posts: PostManager;
    public comments: CommentManager;
    public users: UserManager;

    public on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    public on<S extends string | symbol>(
      event: Exclude<S, keyof ClientEvents>,
      listener: (...args: any[]) => void,
    ): this;

    public login(keys?: ClientLoginKeys): void;
    public destroy(): void;
  }
  
  class GuildBase {
    constructor(client: Client);

    private client: Client;
    public post(title: string, options: PostOptions): Promise<Post>;
    public fetchPosts(options?: GuildPostFetchOptions): Promise<Post[]>;
    public fetchComments(options?: SubmissionFetchOptions): Promise<Comment[]>
  }

  class Guild extends GuildBase {
    constructor(data: APIGuildData, client: Client);
    public static formatData(resp: APIGuildData, client: Client): GuildData;

    public name: string;
    public description: GuildDescription;
    public color: string;
    public id: RuqqusID;
    public full_id: GuildID;
    public link: string;
    public full_link: string;
    public subscribers: number;
    public guildmasters: UserCore[];
    public icon_url: string;
    public banner_url: string;
    public created_at: number;
    public flags: GuildFlags;
  }

  class GuildCore extends GuildBase {
    constructor(data: APIGuildBaseData, client: Client);
    public static formatData(resp: APIGuildBaseData): GuildBaseData;

    public name: string;
    public description: GuildDescription;
    public color: string;
    public id: RuqqusID;
    public full_id: GuildID;
    public link: string;
    public full_link: string;
    public icon_url: string;
    public banner_url: string;
    public created_at: number;
    public flags: GuildFlags;
  }

  class BannedGuild {
    constructor(data: APIBannedGuildData);
    public static formatData(resp: APIBannedGuildData): BannedGuildData;

    public username: string;
    public id: RuqqusID;
    public full_id: GuildID;
    public link: string;
    public full_link: string;
    public ban_reason: string;
    public flags: BannedGuildFlags;
  }

  class All extends GuildBase {
    constructor(client: Client);
    private all: boolean;

    public fetchGuilds(options: GuildFetchOptions): Promise<Guild[]>;
  }

  class PostBase {
    constructor(client: Client);

    private client: Client;
    public comment(body: string): Promise<Comment>;
    public upvote(): void;
    public downvote(): void;
    public removeVote(): void;
    public delete(): void;
    public toggleNSFW(): void;
    public toggleNSFL(): void;
  }

  class Post extends PostBase {
    constructor(data: APIPostData, client: Client);
    public static formatData(resp: APIPostData, client: Client): PostData;

    public author: UserCore;
    public content: PostContent;
    public votes: PostVotes;
    public id: RuqqusID;
    public full_id: PostID;
    public link: string;
    public full_link: string;
    public created_at: number;
    public edited_at: number;
    public comments: number;
    public awards: number;
    public flags: PostFlags;
    public guild: GuildCore;
    public original_guild?: GuildCore;
  }

  class PostCore extends PostBase {
    constructor(data: APIPostCoreData, client: Client);
    public static formatData(resp: APIPostCoreData): PostCoreData;

    public author_name: string;
    public content: PostContent;
    public votes: PostVotes;
    public id: RuqqusID;
    public full_id: PostID;
    public link: string;
    public full_link: string;
    public created_at: number;
    public edited_at: number;
    public comments: number;
    public awards: number;
    public flags: PostFlags;
    public guild_name: string;
    public original_guild_name?: string;
  }

  class CommentBase {
    constructor(client: Client);

    private client: Client;
    public reply(body: string): Promise<Comment>;
    public upvote(): void;
    public downvote(): void;
    public removeVote(): void;
    public delete(): void;
  }

  class Comment extends CommentBase {
    constructor(data: APICommentData, client: Client);
    public static formatData(resp: APICommentData, client: Client): CommentData;

    public author: UserCore;
    public content: CommentContent;
    public votes: CommentVotes;
    public id: RuqqusID;
    public full_id: CommentID;
    public link: string;
    public full_link: string;
    public created_at: number;
    public edited_at: number;
    public chain_level: number;
    public awards: number;
    public flags: CommentFlags;
    public post: PostCore;
    public guild: GuildCore;
  }

  class CommentCore extends CommentBase {
    constructor(data: APICommentCoreData, client: Client);
    public static formatData(resp: APICommentCoreData): CommentCoreData;

    public author_name: string;
    public content: CommentContent;
    public votes: CommentVotes;
    public id: RuqqusID;
    public full_id: CommentID;
    public link: string;
    public full_link: string;
    public created_at: number;
    public edited_at: number;
    public chain_level: number;
    public awards: number;
    public flags: CommentFlags;
  }

  class UserBase {
    constructor(client: Client);
    
    private client: Client;
    public fetchPosts(options?: SubmissionFetchOptions): Promise<Post[]>;
    public fetchComments(options?: SubmissionFetchOptions): Promise<Comment[]>;
  }

  class User extends UserBase {
    constructor(data: APIUserData, client: Client);
    public static formatData(resp: APIUserData): UserData;

    public username: string;
    public title?: UserTitle;
    public bio: UserBio;
    public stats: UserStats;
    public id: RuqqusID;
    public full_id: UserID;
    public link: string;
    public full_link: string;
    public avatar_url: string;
    public banner_url: string;
    public created_at: number;
    public flags: UserFlags;
    public badges: Badge[];
  }

  class UserCore extends UserBase {
    constructor(data: APIUserBaseData, client: Client);
    public static formatData(resp: APIUserBaseData): UserBaseData;

    public username: string;
    public title?: UserTitle;
    public bio: UserBio;
    public id: RuqqusID;
    public full_id: UserID;
    public link: string;
    public full_link: string;
    public avatar_url: string;
    public banner_url: string;
    public created_at: number;
    public flags: UserFlags;
  }

  class BannedUser {
    constructor(data: APIBannedUserData);
    public static formatData(resp: APIBannedUserData): BannedUserData;

    public username: string;
    public id: RuqqusID;
    public full_id: UserID;
    public link: string;
    public full_link: string;
    public ban_reason: string;
    public flags: BannedUserFlags;
  }

  class DeletedUser {
    constructor(data: APIDeletedUserData);
    public static formatData(resp: APIDeletedUserData): DeletedUserData;

    public username: string;
    public id: RuqqusID;
    public full_id: UserID;
    public link: string;
    public full_link: string;
    public flags: DeletedUserFlags;
  }

  class GuildManager {
    constructor(client: Client);
    private client: Client;
    fetch(name: string): Promise<Guild>;
    isAvailable(name: string): Promise<boolean>;
    all: All;
  }

  class PostManager {
    constructor(client: Client);
    private client: Client;
    fetch(id: string): Promise<Post>;
    cache: SubmissionCache;
  }

  class CommentManager {
    constructor(client: Client);
    private client: Client;
    fetch(id: string): Promise<Comment>;
    cache: SubmissionCache;
  }

  class UserManager {
    constructor(client: Client);
    private client: Client;
    fetch(username: string): Promise<User>;
    isAvailable(username: string): Promise<boolean>;
  }

  class Badge {
    constructor(data: APIBadgeData);
    public static formatData(resp: APIBadgeData): BadgeData;

    public name: string;
    public description: string;
    public url: string;
    public created_at: number;
  }
  
  class SubmissionCache {
    constructor();

    private cache: object;
    public _count: number;
    public push(data: Post | Comment): void;
    public add(data: Post[] | Comment[]): void;
    public get(id: string): Post | Comment;
  }

  export class OAuthError extends Error {
    constructor(message: string, code?: number);
  }

  export class ScopeError extends Error {
    constructor(message: string);
  }

  export class RuqqusAPIError extends Error {
    constructor(message: string, code?: number);
  }

  export class Config {
    constructor(path: string);
    public readonly path: string;

    init(options: ConfigOptions): void;
    get(attribute: ConfigAttribute): any;
    set(attribute: ConfigAttribute, value: any): void;
  }
  
  function APIRequest(options: APIRequestOptions): Promise<object>;
  export function getAuthURL(options: AuthURLOptions): string;
  export function getAuthURLInput(): void;
  export function fetchTokens(options: ClientOptions): Promise<APITokenData>;
  
  // #region Option Interfaces

  interface ClientOptions {
    path?: string;
    agent?: string;
  }

  interface ClientLoginKeys {
    id?: string;
    token?: string;
    code?: string;
    refresh?: string;
  }

  interface OAuthCodeKeys {
    id: string;
    token: string;
    type: OAuthGrantType;
    code: string;
  }

  interface OAuthRefreshKeys {
    id: string;
    token: string;
    type: OAuthGrantType;
    refresh: string;
    access_token?: string;
  }

  interface ClientKeys {
    code: OAuthCodeKeys;
    refresh: OAuthRefreshKeys;
  }

  interface ClientEvents {
    post: [Post];
    comment: [Comment];
    login: [void];
  }
  
  interface ClientAPIRequestOptions {
    type: APIRequestMethod;
    path: string;
    auth?: boolean;
    options?: object;
  }

  interface APIRequestOptions extends ClientAPIRequestOptions {
    client: Client;
  }

  interface PostOptions {
    body?: string;
    url?: string;
    nsfw?: boolean;
  }

  interface GuildFetchOptions {
    page?: number;
    sort?: string;
  }

  interface SubmissionFetchOptions {
    page?: number;
    cache?: boolean;
  }

  interface GuildPostFetchOptions extends SubmissionFetchOptions {
    sort?: string;
    filter?: string;
    timeframe?: [number, number];
  }

  interface AuthURLOptions {
    id: string;
    redirect: string;
    state?: string;
    scopes: Scope[] | string;
    permanent?: boolean;
  }

  interface ConfigOptions {
    autosave?: boolean;
    id?: string;
    token?: string;
    agent?: string;
    refresh?: string;
  }

  // #endregion

  // #region Data Interfaces

  interface APIGuildBaseData {
    name: string;
    description: string;
    description_html: string;
    color: string;
    id: RuqqusID;
    fullname: GuildID;
    permalink: string;
    profile_url: string;
    banner_url: string;
    created_utc: number;
    is_banned: boolean;
    is_private: boolean;
    is_restricted: boolean;
    is_siege_protected: boolean;
    over_18: boolean;
  }

  interface APIGuildData extends APIGuildBaseData {
    subscriber_count: number;
    guildmasters: Array<APIUserBaseData | APIBannedUserData | APIDeletedUserData>;
  }

  interface APIBannedGuildData {
    name: string;
    id: RuqqusID;
    permalink: string;
    is_banned: true;
    ban_reason: string;
  }

  interface GuildDescription {
    text: string;
    html: string;
  }

  interface GuildFlags {
    banned: boolean;
    private: boolean;
    restricted: boolean;
    age_restricted: boolean;
    siege_protected: boolean;
  }

  interface BannedGuildFlags {
    banned: boolean;
  }

  interface GuildBaseData {
    name: string;
    description: GuildDescription;
    color: string;
    id: RuqqusID;
    full_id: GuildID;
    link: string;
    full_link: string;
    icon_url: string;
    banner_url: string;
    created_at: number;
    flags: GuildFlags;
  }

  interface GuildData extends GuildBaseData {
    subscribers: number;
    guildmasters: UserCore[];
  }

  interface BannedGuildData {
    name: string;
    id: RuqqusID;
    full_id: GuildID;
    link: string;
    full_link: string;
    ban_reason: string;
    flags: BannedGuildFlags;
  }

  interface APIPostBaseData {
    title: string;
    body: string;
    body_html: string;
    domain: string;
    url: string;
    thumb_url: string;
    embed_url: string;
    score: number;
    upvotes: number;
    downvotes: number;
    voted: number;
    id: RuqqusID;
    fullname: PostID;
    permalink: string;
    created_utc: number;
    edited_utc: number;
    comment_count: number;
    award_count: number;
    archived: boolean;
    is_banned: boolean;
    is_deleted: boolean;
    is_nsfw: boolean;
    is_nsfl: boolean;
    is_offensive: boolean;
    is_political: boolean;
  }

  interface APIPostData extends APIPostBaseData {
    author: APIUserBaseData;
    guild: APIGuildBaseData;
    original_guild?: APIGuildBaseData;
  }

  interface APIPostCoreData extends APIPostBaseData {
    author_name: string;
    guild_name: string;
    original_guild_name?: string | null;
  }

  interface PostBody {
    text: string;
    html: string;
  }

  interface PostContent {
    title: string;
    body: PostBody;
    domain: string | null;
    url: string | null;
    thumbnail: string | null;
    embed: string | null;
  }

  interface PostVotes {
    score: number;
    upvotes: number;
    downvotes: number;
    voted: number | null;
  }

  interface PostFlags {
    archived: boolean;
    banned: boolean;
    deleted: boolean;
    nsfw: boolean;
    nsfl: boolean;
    offensive: boolean;
    political: boolean;
    edited: boolean;
    yanked: boolean;
  }

  interface PostBaseData {
    content: PostContent;
    votes: PostVotes;
    id: RuqqusID;
    full_id: PostID;
    link: string;
    full_link: string;
    created_at: number;
    edited_at: number;
    comments: number;
    awards: number;
    flags: PostFlags;
  }

  interface PostData extends PostBaseData {
    author: UserCore;
    guild: GuildCore;
    original_guild?: GuildCore;
  }

  interface PostCoreData extends PostBaseData {
    author_name: string;
    guild_name: string;
    original_guild_name?: string | null;
  }

  interface APICommentBaseData {
    body: string;
    body_html: string;
    score: number;
    upvotes: number;
    downvotes: number;
    id: RuqqusID;
    fullname: CommentID;
    permalink: string;
    parent_comment_id: string;
    created_utc: number;
    edited_utc: number;
    level: number;
    award_count: number;
    is_archived: boolean;
    is_banned: boolean;
    is_deleted: boolean;
    is_nsfw: boolean;
    is_nsfl: boolean;
    is_offensive: boolean;
    is_bot: boolean;
  }

  interface APICommentData extends APICommentBaseData {
    author: APIUserBaseData;
    post: APIPostCoreData;
    guild: APIGuildBaseData;
  }

  interface APICommentCoreData extends APICommentBaseData {
    author_name: string;
  }

  interface CommentContent {
    text: string;
    html: string;
  }

  interface CommentVotes {
    score: number;
    upvotes: number;
    downvotes: number;
  }

  interface CommentFlags {
    archived: boolean;
    banned: boolean;
    deleted: boolean;
    nsfw: boolean;
    nsfl: boolean;
    offensive: boolean;
    bot: boolean;
    edited: boolean;
  }

  interface CommentBaseData {
    content: CommentContent;
    votes: CommentVotes;
    id: RuqqusID;
    full_id: CommentID;
    link: string;
    full_link: string;
    created_at: number;
    edited_at: number;
    chain_level: number;
    awards: number;
    flags: CommentFlags;
  }

  interface CommentData extends CommentBaseData {
    author: UserCore;
    post: PostCore;
    guild: GuildCore;
  }
  
  interface CommentCoreData extends CommentBaseData {
    author_name: string;
  }

  interface APIUserTitle {
    text: string;
    id: number;
    kind: number;
    color: string;
  }

  interface APIUserBaseData {
    username: string;
    title?: APIUserTitle;
    bio: string;
    bio_html: string;
    id: RuqqusID;
    permalink: string;
    profile_url: string;
    banner_url: string;
    created_utc: number;
    is_banned: boolean;
    is_private: boolean;
    is_premium: boolean;
  }

  interface APIUserData extends APIUserBaseData {
    post_count: number;
    post_rep: number;
    comment_count: number;
    comment_rep: number;
    badges: APIBadgeData[];
  }

  interface APIBannedUserData {
    username: string;
    id: RuqqusID;
    permalink: string;
    is_banned: true;
    ban_reason: string;
  }

  interface APIDeletedUserData {
    username: string;
    id: RuqqusID;
    permalink: string;
    is_deleted: true;
  }

  interface UserTitle {
    name: string;
    id: number;
    kind: number;
    color: string;
  }

  interface UserBio {
    text: string;
    html: string;
  }

  interface UserStats {
    posts: number;
    post_rep: number;
    comments: number;
    comment_rep: number;
  }

  interface UserFlags {
    banned: boolean;
    private: boolean;
    premium: boolean;
  }

  interface BannedUserFlags {
    banned: boolean;
  }

  interface DeletedUserFlags {
    deleted: boolean;
  }

  interface UserBaseData {
    username: string;
    title?: UserTitle;
    bio: UserBio;
    id: RuqqusID;
    full_id: UserID;
    link: string;
    full_link: string;
    avatar_url: string;
    banner_url: string;
    created_at: number;
    flags: UserFlags;
  }

  interface UserData extends UserBaseData {
    stats: UserStats;
    badges: Badge[];
  }

  interface BannedUserData {
    username: string;
    id: RuqqusID;
    full_id: UserID,
    link: string;
    full_link: string;
    ban_reason: string;
    flags: BannedUserFlags;
  }

  interface DeletedUserData {
    username: string;
    id: RuqqusID;
    full_id: UserID;
    link: string;
    full_link: string;
    flags: DeletedUserFlags;
  }

  interface APIBadgeData {
    name: string;
    text: string;
    url: string;
    created_utc: number | null;
  }

  interface BadgeData {
    name: string;
    description: string;
    url: string;
    created_at: number;
  }

  interface APITokenData {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    scopes: Scope[];
  }

  interface APITokenErrorData {
    oauth_error: string;
  }

  // #endregion

  type RuqqusID = string;
  type GuildID = `t4_${RuqqusID}`;
  type PostID = `t2_${RuqqusID}`;
  type CommentID = `t3_${RuqqusID}`;
  type UserID = `t1_${RuqqusID}`;
  type APIRequestMethod = Uppercase<"GET" | "POST">;
  type OAuthGrantType = Lowercase<"code" | "refresh">;
  type Scope = Lowercase<"identity" | "create" | "read" | "update" | "delete" | "vote" | "guildmaster">;
  type ConfigAttribute = Lowercase<"autosave" | "id" | "token" | "agent" | "refresh">
}