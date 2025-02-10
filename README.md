# mongoose-brzan-sequence

**mongoose-brzan-sequence** is a lightweight Mongoose plugin that automatically generates sequential values for a specified field in your MongoDB documents. It uses a dedicated counter collection to ensure atomic, reliable increments and supports optional prefix and suffix formatting.

## Features

- **Auto-incrementing fields:** Automatically generate sequential values for any designated field.
- **Configurable Options:** Set the starting value, increment step, and optionally add prefixes/suffixes.
- **Dedicated counter collection:** Uses a separate counter collection to ensure atomicity.
- **Flexible Prefix/Suffix:** Accepts static strings or dynamic functions for custom formatting.
- **Easy integration:** Simple initialization and plugin application for your Mongoose schemas.

## Installation

Install the package via npm or Yarn:

```bash
npm install mongoose-brzan-sequence
```

or

```bash
yarn add mongoose-brzan-sequence
```

## Quick Start

### 1. Initialize the Plugin

Before using the plugin, initialize it with your Mongoose connection. For example, in your configuration file:

```js
const mongoose = require('mongoose');
const { initialize, plugin: superIncrementPlugin } = require('mongoose-brzan-sequence');

// Initialize the plugin with your Mongoose connection:
initialize(mongoose.connection);
```

### 2. Apply the Plugin to Your Schema

Add the plugin to your schema and configure it with the desired options:

```js
const mongoose = require('mongoose');
const { plugin: superIncrementPlugin } = require('mongoose-brzan-sequence');

// Define your schema:
const MySchema = new mongoose.Schema({
  name: String,
  // Other fields...
});

// Apply the plugin with configuration options:
MySchema.plugin(superIncrementPlugin, {
  model: 'MyModel',      // (Required) The name of the model.
  field: 'customId',     // (Required) Field to store the auto-increment value (cannot be '_id').
  startAt: 1000,         // Starting count (default: 0).
  incrementBy: 1,        // Increment step (default: 1).
  prefix: 'CT-',        // Optional prefix (can be a string or a function).
  suffix: '-US'         // Optional suffix (can be a string or a function).
});

// Create the model:
const MyModel = mongoose.model('MyModel', MySchema);
```

### 3. Creating Documents

When a new document is saved, the specified field (in this case, `customId`) will automatically be assigned a value (e.g., `CT-1000-US`, `CT-1001-US`, etc.):

```js
// Create a new document:
const doc = new MyModel({ name: 'Example' });
doc.save()
  .then(savedDoc => {
    console.log('Saved document with auto-incremented id:', savedDoc.customId);
  })
  .catch(err => {
    console.error('Error saving document:', err);
  });
```

## API Reference

### `initialize(connection)`

Initializes the plugin with the provided Mongoose connection. This must be called before using the plugin.

- **Parameters:**  
  - `connection` (Mongoose Connection Object): Your active Mongoose connection.

- **Example:**

  ```js
  initialize(mongoose.connection);
  ```

### `plugin(schema, options)`

The main plugin function that adds auto-increment functionality to a Mongoose schema.

- **Parameters:**
  - `schema` (Mongoose Schema): The schema to which the plugin is applied.
  - `options` (Object): Configuration options:
    - `model` (String, **Required**): Name of the model.
    - `field` (String, **Required**): Field to store the auto-increment value (must not be `_id`).
    - `startAt` (Number, Optional): Starting count (default is `0`).
    - `incrementBy` (Number, Optional): Increment step (default is `1`).
    - `prefix` (String or Function, Optional): A prefix to prepend to the generated value.
    - `suffix` (String or Function, Optional): A suffix to append to the generated value.

- **Example:**

  ```js
  MySchema.plugin(superIncrementPlugin, {
    model: 'MyModel',
    field: 'customId',
    startAt: 1000,
    incrementBy: 1,
    prefix: 'CT-',
    suffix: '-US'
  });
  ```

## Dynamic Configuration

If you need to use a dynamic value (for example, a prefix stored in a global configuration that may change at runtime), consider using a function for the prefix:

```js
MySchema.plugin(superIncrementPlugin, {
  model: 'MyModel',
  field: 'customId',
  startAt: 1000,
  incrementBy: 1,
  // Provide a function to always retrieve the current prefix value:
  prefix: function(doc) {
    return `${global.settings.prefix}-`; // This returns the current value each time it's called.
  },
  suffix: ''
});
```

*Note:* Ensure that your global configuration is updated in place (e.g. `global.settings.prefix = 'NEW'`) so that the change is reflected without restarting the application.

## Contributing

Contributions are welcome! Please open issues or submit pull requests on the [GitHub repository](https://github.com/MohamedBrzan/mongoose-brzan-sequence).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

Developed by Mohamed Brzan.

## Acknowledgements

Special thanks to the Mongoose community for their excellent ODM library and helpful documentation.  
[Mongoose Middleware Documentation](https://mongoosejs.com/docs/middleware.html)
