---
hide:
  - toc
---

Formatted data representing a user core.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter     | Type                                  | Description                                                  |
|:-------------:|:-------------------------------------:|:------------------------------------------------------------:|
| `username`    | {{ typeURL("String") }}               | The user's name                                              |
| `title`       | {{ typedefLink("UserTitle") }}        | The user title data                                          |
| `bio`         | {{ typedefLink("UserBio") }}          | The user bio dat                                             |
| `id`          | {{ typedefLink("RuqqusID") }}         | The user Ruqqus ID                                           |
| `full_id`     | {{ typedefLink("UserID") }}           | The user User ID                                             |
| `link`        | {{ typeURL("String") }}               | The link to the user's Ruqqus profile                        |
| `full_link`   | {{ typeURL("String") }}               | The usable link to the user's Ruqqus profile                 |
| `avatar_url`  | {{ typeURL("String") }}               | The user avatar URL                                          |
| `banner_url`  | {{ typeURL("String") }}               | The user profile banner URL                                  |
| `created_at`  | {{ typeURL("Number") }}               | A Unix date representing when the user created their account |
| `flags`       | {{ typedefLink("UserFlags") }}        | The user flags                                               |