---
hide:
  - toc
---

An object returned by a deleted user data request.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter    | Type                     | Description                            |
|:------------:|:------------------------:|:--------------------------------------:|
| `username`   | {{ typeURL("String") }}  | The user's name                        |
| `id`         | {{ typeURL("String") }}  | The user Ruqqus ID                     |
| `permalink`  | {{ typeURL("String") }}  | The link to the user's Ruqqus profile  |
| `is_deleted` | {{ typeURL("Boolean") }} | If the user is deleted                 |