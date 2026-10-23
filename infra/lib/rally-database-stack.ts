import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environments';

export interface RallyDatabaseStackProps extends cdk.StackProps {
  readonly config: EnvironmentConfig;
  readonly vpc: ec2.IVpc;
  readonly rdsSecurityGroup: ec2.ISecurityGroup;
}

export class RallyDatabaseStack extends cdk.Stack {
  public readonly databaseInstance: rds.DatabaseInstance;
  public readonly databaseSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: RallyDatabaseStackProps) {
    super(scope, id, props);

    // ── Dedicated Subnet Group across at least 2 AZs (isolated subnets) ─────
    const subnetGroup = new rds.SubnetGroup(this, 'RallyDbSubnetGroup', {
      vpc: props.vpc,
      description: 'Private isolated subnets for RALLY PostgreSQL RDS',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // ── Cryptographically strong generated database password ───────────────
    // Stored in AWS Secrets Manager at /rally/production/database
    this.databaseSecret = new secretsmanager.Secret(this, 'RallyDatabaseSecret', {
      secretName: '/rally/production/database',
      description: 'RALLY application database credentials for PostgreSQL RDS',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          engine: 'postgres',
          database: props.config.dbName,
          username: props.config.dbUsername,
          port: props.config.dbPort,
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // ── PostgreSQL Parameter Group enforcing SSL ─────────────────────────────
    const parameterGroup = new rds.ParameterGroup(this, 'RallyPostgresParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      description: 'Enforces SSL for all RALLY database connections',
      parameters: {
        'rds.force_ssl': '1',
      },
    });

    // ── Amazon RDS PostgreSQL Instance (Single-AZ, db.t4g.micro) ─────────────
    this.databaseInstance = new rds.DatabaseInstance(this, 'RallyRdsInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      subnetGroup,
      securityGroups: [props.rdsSecurityGroup],
      databaseName: props.config.dbName,
      credentials: rds.Credentials.fromSecret(this.databaseSecret, props.config.dbUsername),
      allocatedStorage: props.config.dbAllocatedStorageGb,
      maxAllocatedStorage: props.config.dbMaxAllocatedStorageGb,
      storageType: rds.StorageType.GP3,
      multiAz: false, // Explicit Single-AZ for hackathon cost guardrail
      publiclyAccessible: false, // Strictly NO public access
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(0), // Set to 0 days for AWS Free Tier account compatibility
      parameterGroup,
      deletionProtection: false, // Can be cleaned up during hackathon teardown
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensures clean cdk destroy
    });



    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: this.databaseInstance.instanceEndpoint.hostname,
      description: 'Private RDS PostgreSQL Endpoint Hostname',
    });
    new cdk.CfnOutput(this, 'RdsSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'Secrets Manager Secret ARN for Database Credentials',
    });
  }
}
