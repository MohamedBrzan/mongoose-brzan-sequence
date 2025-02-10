/**
 * @file mongoose-super-increment.js
 * @description Mongoose plugin for auto-incrementing a field with a counter collection, supporting prefixes and suffixes.
 * @module mongooseSuperIncrement
 * @author Mohamed Brzan
 */

const { Schema } = require('mongoose');

const pluginName = 'MongooseSuperIncrement';
const counterCollectionName = '_Counter';
let Counter;

// Option validation schema
const optionDefinitions = {
    model: {
        required: true,
        type: 'string',
        validate: (v) => typeof v === 'string',
        error: 'must be a string'
    },
    field: {
        required: true,
        type: 'string',
        validate: (v) => typeof v === 'string' && v !== '_id',
        error: 'must be a string and not "_id"'
    },
    startAt: {
        default: 0,
        type: 'number',
        validate: (v) => typeof v === 'number',
        error: 'must be a number'
    },
    incrementBy: {
        default: 1,
        type: 'number',
        validate: (v) => typeof v === 'number',
        error: 'must be a number'
    },
    prefix: {
        default: '',
        type: ['string', 'function'],
        validate: (v) => ['string', 'function'].includes(typeof v),
        error: 'must be a string or function'
    },
    suffix: {
        default: '',
        type: ['string', 'function'],
        validate: (v) => ['string', 'function'].includes(typeof v),
        error: 'must be a string or function'
    }
};

/**
 * Initializes the counter model with proper indexing
 * @param {import('mongoose').Connection} connection 
 */
const initialize = (connection) => {
    try {
        Counter = connection.model(counterCollectionName);
    } catch (err) {
        if (err.name === 'MissingSchemaError') {
            const CounterSchema = new Schema({
                model: { type: String, required: true },
                count: { type: Number, default: 0 },
                field: { type: String, required: true }
            });

            // Add unique compound index for fast lookups
            CounterSchema.index({ model: 1, field: 1 }, { unique: true });
            Counter = connection.model(counterCollectionName, CounterSchema);
        } else {
            throw err;
        }
    }
};

/**
 * Validates and parses plugin options with modern type checking
 * @param {object} options 
 * @returns {object}
 */
const parseOptions = (options) => {
    if (typeof options !== 'object' || options === null) {
        throw new Error(`${pluginName}: Options must be an object`);
    }

    const parsed = {};
    for (const [key, def] of Object.entries(optionDefinitions)) {
        if (def.required && !(key in options)) {
            throw new Error(`${pluginName}: '${key}' is required`);
        }

        const value = options[key];
        if (value !== undefined) {
            if (!def.validate(value)) {
                throw new Error(`${pluginName}: '${key}' ${def.error}`);
            }
            parsed[key] = value;
        } else {
            parsed[key] = def.default;
        }
    }
    return parsed;
};

/**
 * Generates the formatted value with async prefix/suffix resolution
 * @param {object} settings 
 * @param {import('mongoose').Document} doc 
 * @param {number} count 
 * @returns {Promise<string>}
 */
const generateFormattedValue = async (settings, doc, count) => {
    const [prefix, suffix] = await Promise.all([
        typeof settings.prefix === 'function' ? settings.prefix(doc) : settings.prefix,
        typeof settings.suffix === 'function' ? settings.suffix(doc) : settings.suffix
    ]);

    return `${prefix ?? ''}${count}${suffix ?? ''}`;
};

/**
 * Atomic counter update using MongoDB's findOneAndUpdate
 * @param {object} settings 
 * @param {import('mongoose').Document} doc 
 */
const updateCounter = async (settings, doc) => {
    if (!doc.isNew) return;

    const filter = { model: settings.model, field: settings.field };
    const update = [{
        $set: {
            count: {
                $cond: {
                    if: { $eq: ['$count', null] },
                    then: settings.startAt,
                    else: { $add: ['$count', settings.incrementBy] }
                }
            }
        }
    }];

    const result = await Counter.collection.findOneAndUpdate(
        filter,
        update,
        { returnDocument: 'after', upsert: true }
    );

    doc[settings.field] = await generateFormattedValue(settings, doc, result.value.count);
};

/**
 * Main plugin implementation
 * @param {Schema} schema 
 * @param {object} options 
 */
const plugin = (schema, options) => {
    if (!Counter) throw new Error(`${pluginName}: Not initialized`);

    const settings = parseOptions(options);

    // Prevent schema conflicts
    if (schema.path(settings.field)) {
        throw new Error(`${pluginName}: Field '${settings.field}' already exists`);
    }

    schema.add({ [settings.field]: { type: String } });
    schema.pre('save', async function () {
        await updateCounter(settings, this);
    });
};

module.exports = { initialize, plugin };