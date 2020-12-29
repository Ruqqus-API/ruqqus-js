---
hide:
  - toc
---

Data returned by an OAuth grant.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter       | Type                                               | Description                                            |
|:---------------:|:--------------------------------------------------:|:------------------------------------------------------:|
| `access_token`  | {{ typeURL("String") }}                            | The API access token                                   |
| `refresh_token` | {{ typeURL("String") }}                            | The OAuth refresh token                                |
| `expires_at`    | {{ typeURL("Number") }}                            | A Unix date representing when the access token expires |
| `scopes`        | {{ typedefArray("Scope") }}                        | The list of the scopes provided with the grant         |