# node-mysql-backbone

[![Build Status](https://travis-ci.org/michalkow/node-mysql-backbone.svg?branch=master)](https://travis-ci.org/michalkow/node-mysql-backbone)

A [backbone](http://backbonejs.org) based model and collection for communicating with a MySQL database using [mysqljs/mysql](https://github.com/mysqljs/mysql).

## Install

Install from npm package with mysql peer dependecy:

```bash
npm install mysql-backbone mysql
```

## Usage

Add the mysql-backbone module to your application and create a model or collection that will be main one for your application (all others will extend it):

```javascript
var mysql      = require('mysql');
var mysqlBackbone = require('mysql-backbone');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'me',
  password : 'secret',
  database : 'my_db'
});

connection.connect();

var Movie = mysqlBackbone.Model.extend({
	connection: connection,
	tableName: "movies",
});

var Movies = mysqlBackbone.Collection.extend({
	model: Movie,
	connection: connection,
	tableName: "movies",
});

var movies = new Movies();

var movie = new Movie({
	name: 'Serenity',
	director: 'Joss Whedon',
	language: 'English',
	year: 2005
});

connection.end();
```		
	
To see complete list of options for creating a connection with the database visit [mysqljs/mysql](https://github.com/mysqljs/mysqll#connection-options) readme. 	

## API

### Collection Settable Options

```javascript
var Movies = MyAppModel.extend({
	tableName: "movies", // Name of a MySQL table the model will refer to
	idAttribute: "id", // MySql table primary key | default: "id"
	connection: connection // mysql.createConnection object
	model: model // mysqlBackbone.Model model
});
```	

### Collection Methods

#### fetch

*Retrieves records from database*

Usage:

```javascript
movies.fetch();
movies.fetch(conditions);
```		
Parameters:

- *object* **conditions**: set find conditions

Example:

```javascript
movies.fetch({where: "year > 2001"}).then(function(result) {
	// Do something...
});
```		

#### create

*Adds new model to collection and the database*

Usage:

```javascript
movies.create(data);
```		
Parameters:

- *object* **data**: fields for the new object

Example:

```javascript
movies.create({
	name: 'What Happened to Monday',
	director: 'Tommy Wirkola',
	language: 'English',
	year: 2017
}).then(function(result) {
	console.log(result);
	/*
		{
			id: 123,
			name: 'What Happened to Monday',
			director: 'Tommy Wirkola',
			language: 'English',
			year: 2017
		}
	*/
});
```		

#### destroy

*Deletes models from database and removes them from this collection*

Usage:

```javascript
movies.destroy(models);
```		
Parameters:

- *array* **models**: Array of Models or primary keys

Returns:

- object

Example:

```javascript
movies.destroy([1, 2, 3]).then(function(result) {
	console.log(result);
});
```	

#### count

*Returns number of records matching conditions*

Usage:

```javascript
movies.count();
movies.count(conditions);
```		
Parameters:

- *object* **conditions**: set find conditions

Returns:

- integer

Example:

```javascript
movies.count({where: "language = English"}).then(function(result) {
	console.log(result);
});
```	

### Model Settable Options

```javascript
var Movie = MyAppModel.extend({
	tableName: "movies", // Name of a MySQL table the model will refer to
	idAttribute: "id", // MySql table primary key | default: "id"
	connection: connection // mysql.createConnection object
});
```	

### Model Methods

#### fetch


*Retrieves records from database*

Usage:

```javascript
movie.fetch();
movie.fetch(id);
movie.fetch(id, fields);
```		
Parameters:

- *integer* **id**: primary key to fetch
- *array* **fields**: array of fields to set in model

Example:

```javascript
movie.fetch(1, ['id', 'name'].then(function (movie) {
	// Do something...
});
```		

#### save

*Saves your model to database*

Usage:

```javascript
movie.save();
movie.save(id);
```	
Parameters:

- *integer* **id**: primary key to save

Example:

```javascript
movie = new Movie({
	name: 'Serenity',
	director: 'Joss Whedon',
	language: 'English',
	year: 2005
});
// Will create new record
movie.save();
movie.set('id', 4);
// Will update record if id exists
movie.save();
// Alternative
movie.save(4);
```		

#### destroy

*Deletes your model from database and unsets it*

```javascript
movie.destroy();
movie.destroy(id);
```	
Parameters:

- *integer* **id**: primary key to destroy

Example:

```javascript
// Will delete record from database matching id model
movie.set('id', 8);
movie.destroy();
// Alternative
movie.destroy(8);
```	


### 'fetch' conditions

#### fields

*Fields to select from the table*

Accepts:

- array
- string

Example:

```javascript
movies.fetch({fields: ['id', 'name', 'year']});
// SELECT id, name, year FROM movies
movies.fetch({fields: "name"});
// SELECT name FROM movies
```	

#### where

*Operators for MySQL WHERE clause.*

Accepts:

- string

Example:

```javascript
movies.fetch({where: "year > 1987"});
// SELECT * FROM movies WHERE year > 1987
```	

#### group

*Operators for MySQL GROUP BY clause.*

Accepts:

- array
- string

Example:

```javascript
movies.fetch({group: ['year', 'name']});
// SELECT * FROM movies GROUP BY year, name
movies.fetch({group: "name"});
// SELECT * FROM movies GROUP BY name
```	

#### groupDESC

*If true, sets descending order for GROUP BY*

Accepts:

- boolean

Example:

```javascript
movies.fetch({group: ['year', 'name'], groupDESC:true});
// SELECT * FROM movies GROUP BY year, name DESC
```	

#### having

*Operators for MySQL HAVING clause.*

Accepts:

- string

Example:

```javascript
movies.fetch({fields: ['name', 'COUNT(name)'], group: "name", having: "COUNT(name) = 1"});
// SELECT name, COUNT(name) FROM movies GROUP BY name HAVING COUNT(name) = 1
```

#### order

*Operators for MySQL ORDER BY clause.*

Accepts:

- array
- string

Example:

```javascript
movies.fetch({group: ['year', 'name']});
// SELECT * FROM movies ORDER BY year, name
movies.fetch({group: "name"});
// SELECT * FROM movies ORDER BY name
```	

#### orderDESC

*If true, sets descending order for ORDER BY*

Accepts:

- boolean

Example:

```javascript
movies.fetch({group: ['year', 'name'], orderDESC:true});
// SELECT * FROM movies ORDER BY year, name DESC
```	

#### limit

*Operators for MySQL LIMIT clause.*

Accepts:

- array
- string

Example:

```javascript
movies.fetch({limit: [0, 30]});
// SELECT * FROM movies LIMIT 0, 30
movies.fetch({limit: "10, 40"});
// SELECT * FROM movies LIMIT 10, 40
```	

## Todo

- write sync function for collection
- validation schemas
- use 3rd party sql query builder
- write more tests
				
## License

node-mysql-backbone is released under [MIT license](http://opensource.org/licenses/mit-license.php).

## Credits

node-mysql-backbone was created by [Michał Kowalkowski](https://github.com/michalkow). You can contact me at [kowalkowski.michal@gmail.com](mailto:kowalkowski.michal@gmail.com)
