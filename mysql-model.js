var Backbone = require('backbone');
var Promise = require("bluebird");

// Main model
var MysqlModel = Backbone.Model.extend({
	// Function returning one set of results and setting it to model it was used on
	fetch: function (id, fields) {
		var self = this;
		fields = fields || '*';
		id = id || self.id || self.attributes[self.primaryKey];
		return new Promise(function(resolve, reject) {
			if (!id) reject(new Error('mysql-model: No id passed or set'));
			if (!self.connection) reject(new Error('mysql-model: No connection'));
			var q = "SELECT " + fields + " FROM " + self.tableName + " WHERE " + self.primaryKey + "=" + id;
			self.connection.query(q, function (err, result, fields) {
				if (err || !result) reject(err);
				else {
					self.set(result[0]);
					resolve(result[0]);
				}
			});		
		});
	},
	read: function (id, fields) {
		console.warn('mysql-model: read is deprecated method, use fetch instead.')
		return this.fetch(id, fields);
	},
	// Function saving your model attributes
	save: function (id) {
		var self = this;
		id = id || self.id || self.attributes[self.primaryKey];
		return new Promise(function (resolve, reject) {
			if (!self.connection) reject(new Error('mysql-model: No connection'));
			if (!id) {
				var query = "INSERT INTO " + self.tableName + " SET " + self.connection.escape(self.attributes);
				self.connection.query(query, function (err, results, fields) {
					if (err) reject(err);
					else if (!results.insertId) reject(new Error('mysql-model: No row inserted.'));
					else {
						self.set(self.primaryKey, results.insertId);
						resolve(results);
					}
				})				
			} else {
				var query = "UPDATE " + self.tableName + " SET " + self.connection.escape(self.attributes) + " WHERE " + self.primaryKey + "=" + self.connection.escape(id);
				self.connection.query(query, function (err, results, fields) {
					if (err) reject(err);
					else if (!results.changedRows) reject(new Error('mysql-model: No rows changed.'));
					else resolve(results);
				})
			}
		});
	},	
	// Function for removing records
	destroy: function (id) {
		var self = this;
		id = id || self.id || self.attributes[self.primaryKey];
		return new Promise(function (resolve, reject) {
			if (!id) reject(new Error('mysql-model: No id passed or set'));
			if (!self.connection) reject(new Error('mysql-model: No connection'));
			var query = "DELETE FROM " + self.tableName + " WHERE " +self.primaryKey+ "=" + self.connection.escape(id);
			self.connection.query(query, function (err, results) {
				if (err) reject(err);
				else if (!results.affectedRows) reject(new Error('mysql-model: No rows removed.'));
				else {
					self.clear();
					resolve(results);
				}
			});
		});
	},
	remove: function(id) {
		console.warn('mysql-model: remove is deprecated method, use destroy instead.');
		return this.destroy(id);
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
	}
});

module.exports = MysqlModel;