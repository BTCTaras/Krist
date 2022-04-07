/**
 * Created by Drew Lemmy, 2016-2021
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
 * For more project information, see <https://github.com/tmpim/krist>.
 */

const utils      = require("./utils.js");
const constants  = require("./constants.js");
const schemas    = require("./schemas.js");
const database   = require("./database.js");
const websockets = require("./websockets.js");
const { Op, QueryTypes } = require("sequelize");

const promClient = require("prom-client");
const promNamesPurchasedCounter = new promClient.Counter({
  name: "krist_names_purcahsed_total",
  help: "Total number of purchased since the Krist server first started."
});

function Names() {}

Names.getNames = function(limit, offset) {
  return schemas.name.findAndCountAll({order: [["name", "ASC"]], limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Names.getNamesByAddress = function(address, limit, offset) {
  return schemas.name.findAndCountAll({order: [["name", "ASC"]], where: {owner: address}, limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Names.lookupNames = function(addressList, limit, offset, orderBy, order) {
  return schemas.name.findAndCountAll({
    order: [[orderBy || "name", order || "ASC"]],
    limit: utils.sanitiseLimit(limit),
    offset: utils.sanitiseOffset(offset),
    where: addressList ? { owner: {[Op.in]: addressList} } : undefined,
  });
};

Names.getDetailedUnpaid = function() {
  return database.getSequelize().query(`
    SELECT COUNT(*) AS \`count\`, \`unpaid\` FROM \`names\`
    GROUP BY \`unpaid\`
    ORDER BY \`unpaid\` ASC;
  `, { type: QueryTypes.SELECT });
};

Names.getNameCountByAddress = function(address) {
  return schemas.name.count({where: {owner: address}});
};

Names.getNameByName = function(name) {
  return schemas.name.findOne({where: {name: name}});
};

Names.getUnpaidNames = function(limit, offset) {
  return schemas.name.findAndCountAll({order: [["id", "DESC"]], where: {unpaid: {[Op.gt]: 0}},  limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Names.getUnpaidNameCount = function(t) {
  return schemas.name.count({where: {unpaid: {[Op.gt]: 0}}}, { transaction: t });
};

Names.getNameCost = function() {
  return constants.nameCost;
};

Names.createName = async function(name, owner) {
  const dbName = await schemas.name.create({
    name,
    owner,
    original_owner: owner,
    registered: new Date(),
    updated: new Date(),
    transferred: null,
    unpaid: Names.getNameCost()
  });

  promNamesPurchasedCounter.inc();

  websockets.broadcastEvent({
    type: "event",
    event: "name",
    name: Names.nameToJSON(dbName)
  });

  return dbName;
};

Names.nameToJSON = function(name) {
  return {
    name: name.name,
    owner: name.owner,
    original_owner: name.original_owner,
    registered: name.registered,
    updated: name.updated,
    transferred: name.transferred || null,
    a: name.a,
    unpaid: name.unpaid || 0
  };
};

module.exports = Names;
