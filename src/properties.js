const config = require('./config');
const AWS = require('aws-sdk');

AWS.config.update({ region: config.region });

const TABLE_NAME = 'properties';

class Properties {
  constructor() {
    this._db = new AWS.DynamoDB({ apiVersion: '2012-10-08' });
  }

  async _createTablePromise(params) {
    return new Promise((resolve, reject) => {
      this._db.createTable(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async createTable() {
    var params = {
      AttributeDefinitions: [
        {
          AttributeName: 'CUSTOMER_ID',
          AttributeType: 'N'
        },
        {
          AttributeName: 'CUSTOMER_NAME',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'CUSTOMER_ID',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'CUSTOMER_NAME',
          KeyType: 'RANGE'
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      },
      TableName: TABLE_NAME,
      StreamSpecification: {
        StreamEnabled: false
      }
    };

    return this._createTablePromise(params);
  }

  async _deleteTablePromise(params) {
    return new Promise((resolve, reject) => {
      this._db.deleteTable(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async deleteTable() {
    return this._deleteTablePromise({
      TableName: TABLE_NAME
    });
  }
}

module.exports = Properties;
