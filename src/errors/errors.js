/**
 * Created by Drew Lemmy, 2016
 *
 * This file is part of Krist.
 *
 * Krist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Krist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Krist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

var	util    = require('util'),
	fs      = require('fs'),
	path    = require('path');

var errors = {};

errors.KristError = function(message) {
	Error.call(this);
	this.message = message;
	this.errorString = 'unknown_error';
	this.statusCode = 500;

	this.info = {};
};

util.inherits(errors.KristError, Error);

module.exports = errors;

try {
	var findPath = path.join(__dirname, './');

	fs.readdirSync(findPath).forEach(function(file) {
		if (path.extname(file).toLowerCase() !== '.js' ||
			path.basename(file).toLowerCase() === path.basename(this.filename).toLowerCase()) {

			return;
		}

		try {
			require('./' + file);
		} catch (error) {
			console.log('[Error]'.red + ' Uncaught error: `' + file + '`: ');
			console.log(error.stack);
		}
	});
} catch (error) {
	console.log('[Error]'.red + ' Uncaught error: ');
	console.log(error.stack);
}

module.exports = errors;