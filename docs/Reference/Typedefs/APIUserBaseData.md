---
hide:
  - toc
---

An object returned by a user core data request.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter     | Type                                  | Description                                                  |
|:-------------:|:-------------------------------------:|:------------------------------------------------------------:|
| `username`    | {{ typeURL("String") }}               | The user's name                                              |
| `title`       | {{ typedefLink("APIUserTitle") }}     | The user title data                                          |
| `bio`         | {{ typeURL("String") }}               | The user bio                                                 |
| `bio_html`    | {{ typeURL("String") }}               | The user bio, with HTML tags                                 |
| `id`          | {{ typedefLink("RuqqusID") }}         | The user Ruqqus ID                                           |
| `permalink`   | {{ typeURL("String") }}               | The link to the user's Ruqqus profile                        |
| `profile_url` | {{ typeURL("String") }}               | The user's avatar URL                                        |
| `banner_url`  | {{ typeURL("String") }}               | The user's profile banner URL                                |
| `created_utc` | {{ typeURL("Number") }}               | A Unix date representing when the user created their account |
| `is_banned`   | {{ typeURL("Boolean") }}              | If the user is banned                                        |
| `is_private`  | {{ typeURL("Boolean") }}              | If the user has a private profile                            |
| `is_premium`  | {{ typeURL("Boolean") }}              | If the user has Ruqqus Premium                               |