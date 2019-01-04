var Backbone = require('backbone');
var Promise = require("bluebird");
var _ = require("underscore");
var MysqlModel = require("./mysql-model.js");

var MysqlCollection = Backbone.Collection.extend({
	model: MysqlModel,
	// Sync current models
	sync: function (conditions) {
		var self = this;
		var tableName = self.model.prototype.tableName || self.tableName;
		var connection = self.model.prototype.connection || self.connection;
		var primaryKey = self.model.prototype.primaryKey || self.primaryKey || 'id';
		var parsed = self._parseConditions(conditions);
		return new Promise(function (resolve, reject) {
			if (!connection) reject(new Error('mysql-model: No connection'));
			var ids = _.map(self.models, function (model) {
				return model.id;
			});
			var query = "SELECT " + parsed.fields + " from " + tableName + " WHERE " + primaryKey + " IN (" + self.connection.escape(ids) + ");"
			connection.query(query, function (err, rows) {
				if (err || !rows) reject(err);
				else {
					self.set(rows);
					resolve(rows);
				}
			});
		});
	},
	// Function saving your model attributes
	create: function (data) {
		var self = this;
		var tableName = self.model.prototype.tableName || self.tableName;
		var connection = self.model.prototype.connection || self.connection;
		var primaryKey = self.model.prototype.primaryKey || self.primaryKey || 'id';
		return new Promise(function (resolve, reject) {
			if (!connection) reject(new Error('mysql-model: No connection'));
			var query = "INSERT INTO " + tableName + " SET " + connection.escape(data);
			connection.query(query, function (err, results, fields) {
				if (err) reject(err);
				else if (!results.insertId) reject(new Error('mysql-model: No row inserted.'));
				else {
					data[primaryKey] = results.insertId;
					self.add(data);
					resolve(data);
				}
			});
		});
	},	
	// Function saving your model attributes
	save: function (data) {
		var self = this;
		var tableName = self.model.prototype.tableName || self.tableName;
		var connection = self.model.prototype.connection || self.connection;
		var primaryKey = self.model.prototype.primaryKey || self.primaryKey || 'id';
		return new Promise(function (resolve, reject) {
			if (!connection) reject(new Error('mysql-model: No connection'));
			if (!self.models[0]) reject(new Error('mysql-model: No models'));
			var attributes = self.models[0].attributes;
			var query = "INSERT INTO " + tableName + " (" + _.keys(attributes).join(',')  + ") VALUES ";
			query += _.map(self.models, function(model) {
				return '(' + _.map(attributes, function (val, key) { return "'"+model.toJSON()[key]+"'"; }) + ')'
			}).join(',');
			query += " ON DUPLICATE KEY UPDATE ";
			query += _.map(_.reject(_.keys(attributes), function (key) { return key == primaryKey; }), function (key) { return key + '=VALUES(' + key +')'; }).join(',');
			query += ";";
			console.warn(query);
			connection.query(query, function (err, results, fields) {
				if (err) reject(err);
				else resolve();
			});
		});
	},	
	// Function updating your model attributes
	update: function (values, conditions) {
		var self = this;
		var tableName = self.model.prototype.tableName || self.tableName;
		var connection = self.model.prototype.connection || self.connection;
		var parsed = self._parseConditions(conditions);
		return new Promise(function (resolve, reject) {
			if (!connection) reject(new Error('mysql-model: No connection'));
			var query = "UPDATE " + tableName + " SET " + connection.escape(values) + parsed.query;
			connection.query(query, function (err, results, fields) {
				if (err) reject(err);
				else if (!results.changedRows) reject(new Error('mysql-model: No rows changed.'));
				else self.sync(conditions).then(function (params) {
					resolve();
				}).catch(function (err) {
					reject(err);
				});
			});
		});
	},	
	// Function destroy your model attributes
	destroy: function (models) {
		var self = this;
		var tableName = self.model.prototype.tableName || self.tableName;
		var connection = self.model.prototype.connection || self.connection;
		var primaryKey = self.model.prototype.primaryKey || self.primaryKey || 'id';
		if (typeof models === 'string' || typeof models === 'number') {
			var model = new self.model();
			self.remove(models);
			return model.destroy(models);
		} else if (self._isModel(models) && models.has('id')) {
			self.remove(models);
			return models.destroy();
		}
		return new Promise(function (resolve, reject) {
			if (Object.prototype.toString.call(models) == '[object Array]') {
				var ids = _.map(models, function(model) {
					return model.id || model;
				});
				var query = "DELETE from " + tableName + " WHERE " + primaryKey + " IN (" + self.connection.escape(ids) + ");"
				connection.query(query, function (err, results) {
					if (err) reject(err);
					else if (!results.affectedRows) reject(new Error('mysql-model: No rows removed.'));
					else {
						self.remove(ids);
						resolve(results);
					}
				});
			} else {
				reject(new Error('mysql-model: Invalid argument, pass models.'));
			}
		});
	},
	// Count function
	count: function (conditions) {
		var self = this;
		var tableName = self.model.prototype.tableName || self.tableName;
		var connection = self.model.prototype.connection || self.connection;
		var parsed = self._parseConditions(conditions);
		return new Promise(function (resolve, reject) {
			if (!self.connection) reject(new Error('mysql-model: No connection'));
			var q = "SELECT COUNT(*) FROM " + tableName + parsed.query;
			self.connection.query(q, function (err, result, fields) {
				if (err || !result) reject(err);
				else resolve(result[0]['COUNT(*)']);
			});
		});
	},
	// Function with set of methods to return records from database
	find: function (conditions) {
		console.warn('mysql-model: find is deprecated method, use fetch instead.')
		return this.fetch(conditions);
	},
	fetch: function (conditions) {
		var self = this;
		var tableName = self.model.prototype.tableName || self.tableName;
		var connection = self.model.prototype.connection || self.connection;
		var parsed = self._parseConditions(conditions);
		return new Promise(function (resolve, reject) {
			if (!self.connection) reject(new Error('mysql-model: No connection'));
			var q = "SELECT " + parsed.fields + " FROM " + tableName + parsed.query;
			self.connection.query(q, function (err, result, fields) {
				if (err || !result) reject(err);
				else {
					self.set(result);
					resolve(result);
				}
			});
		});
	},
	// Function for creating custom queries
	query: function (query) {
		console.warn('mysql-model: query is deprecated method.');
		var self = this;
		return new Promise(function (resolve, reject) {
			if (!self.connection) reject(new Error('mysql-model: No connection'));
			self.connection.query(query, function (err, results, fields) {
				if (err || !results) reject(err);
				else resolve(results);
			});
		});
	},
	_parseConditions: function (conditions) {
		var query = '';
		var fields = '*';
		if (conditions) {
			if (conditions.fields)
				fields = conditions.fields;
			if (conditions.where)  
				query += " WHERE " + conditions.where;
			if (conditions.group) {
				query += " GROUP BY " + conditions.group;
				if (conditions.groupDESC) 
					query += " DESC";
			}
			if (conditions.having) 
				query += " HAVING " + conditions.having;
			if (conditions.order) {
				query += " ORDER BY " + conditions.order;
				if (conditions.orderDESC) 
					query += " DESC";
			}
			if (conditions.limit) 
				query += " LIMIT " + conditions.limit;
		}
		return {
			fields: fields,
			query: query
		}
	}
});


module.exports = MysqlCollection;