"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tweet = void 0;
const types_1 = require("./types");
const mutation_1 = require("./mutation");
const resolver_1 = require("./resolver");
const queries_1 = require("./queries");
exports.Tweet = { types: types_1.types, mutations: mutation_1.mutations, resolvers: resolver_1.resolvers, queries: queries_1.queries };
