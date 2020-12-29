Abstract class representing the base Guild methods.

## Methods

### **`.post(title, options)`**
Submits a post to the guild. Must have either a valid body or URL.

| Parameter      | Type          | Optional         | Description                                      |
| :------------: | :-----------: | :--------------: | :----------------------------------------------: |
| `title`        | **`String`**  |                  | The title of the post                            |
| `options`      | **`Object`**  |                  | The post parameters                              |
| `options.body` | **`String`**  | :material-check: | The body of the post                             |
| `options.url`  | **`String`**  | :material-check: | The post URL                                     |
| `options.nsfw` | **`Boolean`** | :material-check: | Whether or not the post should be marked as NSFW |