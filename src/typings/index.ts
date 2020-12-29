/// <reference path="index.d.ts"/>

import { Client, getAuthURL, RuqqusAPIError } from "ruqqus-js";

const url: string = getAuthURL({
  id: "APPLICATION_ID",
  redirect: "https://example.com",
  scopes: [ "guildmaster", "vote" ]
});

console.log(url.length);

const client: Client = new Client({
  agent: "USER_AGENT",
  path: "some/file/path/config.json"
});

client.config.get("id");

client.on("login", async () => {
  console.log(`Logged in as ${client.user.username}!`);
  client.guilds.fetch("guild-name").then(g => {
    console.log(`The guildmasters of ${g.name} are: ${g.guildmasters.map(u => u.username).join(", ")}`);
  });

  let user = await client.users.fetch("user-without-a-title");
  if (!user.title) throw new RuqqusAPIError("User doesn't have a title.");
});

client.on("comment", comment => {
  console.log(`This comment was posted by @${comment.author.username}.`);
  console.log(`Their user title: ${comment.author.title?.name}"`);
});

client.on("post", async post => {
  let otherPosts = await post.guild.fetchPosts({ page: 2, timeframe: [0, 30000] });
  otherPosts.forEach(p => {
    if (p.flags.edited) console.log(`Post ${p.full_id} was edited at ${new Date(p.edited_at).toLocaleTimeString("en-US")}`);
  });
});

client.login({
  id: "APPLICATION_ID",
  token: "CLIENT_SECRET",
  code: "AUTHCODE",
});