---
hide:
  - toc
---

An object returned by a banned user data request.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter    | Type                     | Description                            |
|:------------:|:------------------------:|:--------------------------------------:|
| `username`   | {{ typeURL("String") }}  | The user's name                        |
| `id`         | {{ typeURL("String") }}  | The user Ruqqus ID                     |
| `permalink`  | {{ typeURL("String") }}  | The link to the user's Ruqqus profile  |
| `is_banned`  | {{ typeURL("Boolean") }} | If the user is banned                  |
| `ban_reason` | {{ typeURL("String") }}  | The reason for the user being banned   |