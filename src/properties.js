// TODO: how do secondary indexes work?

// TODO: auto backups?

// TODO: Point-in-time recovery?

// TODO: need to poll when table created to wait for ACTIVE state before use?

const config = require('./config');
const AWS = require('aws-sdk');

AWS.config.update({ region: config.region });

const TABLE_NAME = 'properties';

class Properties {
  constructor() {
    this._db = new AWS.DynamoDB({ apiVersion: '2012-10-08' });
    this._scaling = new AWS.ApplicationAutoScaling({
      apiVersion: '2016-02-06'
    });
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
      // BillingMode: 'PAY_PER_REQUEST',
      TableName: TABLE_NAME
      // StreamSpecification: {
      //   StreamEnabled: false
      // }
    };

    const response = await this._createTablePromise(params);

    await this._enableAutoScaling();

    return response;
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

  async _registerScalableTargetPromise(params) {
    return new Promise((resolve, reject) => {
      this._scaling.registerScalableTarget(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async _putScalingPolicyPromise(scalingPolicy) {
    return new Promise((resolve, reject) => {
      this._scaling.putScalingPolicy(scalingPolicy, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async _enableAutoScalingForOperation(operation) {
    const response1 = await this._registerScalableTargetPromise({
      MaxCapacity: 40000,
      MinCapacity: 5,
      ResourceId: 'table/' + TABLE_NAME,
      RoleARN: 'arn:aws:iam::' + config.accountId + ':role/TestRole',
      ScalableDimension: `dynamodb:table:${operation}CapacityUnits`,
      ServiceNamespace: 'dynamodb'
    });
    // console.log({ response1 })

    const response2 = await this._putScalingPolicyPromise({
      ServiceNamespace: 'dynamodb',
      ResourceId: 'table/' + TABLE_NAME,
      ScalableDimension: `dynamodb:table:${operation}CapacityUnits`,
      PolicyName: TABLE_NAME + '-scaling-policy',
      PolicyType: 'TargetTrackingScaling',
      TargetTrackingScalingPolicyConfiguration: {
        PredefinedMetricSpecification: {
          PredefinedMetricType: `DynamoDB${operation}CapacityUtilization`
        },
        ScaleOutCooldown: 60,
        ScaleInCooldown: 60,
        TargetValue: 70.0
      }
    });
    // console.log({ response2 })
  }

  async _enableAutoScaling() {
    await this._enableAutoScalingForOperation('Read');
    await this._enableAutoScalingForOperation('Write');
  }
}

module.exports = Properties;
