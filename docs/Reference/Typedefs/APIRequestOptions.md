---
hide:
  - toc
---

Options for an API request.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter | Type                                  | Optional         | Default | Description                                 |
|-----------|---------------------------------------|------------------|---------|---------------------------------------------|
| `type`    | {{ typedefLink("APIRequestMethod") }} |                  | *none*  | The request method                          |
| `path`    | {{ typeURL("String") }}               |                  | *none*  | The request endpoint                        |
| `auth`    | {{ typeURL("Boolean") }}              | :material-check: | `true`  | If the endpoint requires authorization keys |
| `options` | {{ typeURL("Object") }}               | :material-check: | `{}`    | Extra header request options                |