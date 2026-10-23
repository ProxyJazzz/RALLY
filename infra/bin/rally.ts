#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { productionConfig } from '../config/environments';
import { RallyNetworkStack } from '../lib/rally-network-stack';
import { RallyEndpointsStack } from '../lib/rally-endpoints-stack';
import { RallyDatabaseStack } from '../lib/rally-database-stack';
import { RallyEcrStack } from '../lib/rally-ecr-stack';
import { RallyIamStack } from '../lib/rally-iam-stack';
import { RallyComputeStack } from '../lib/rally-compute-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '043914966140',
  region: process.env.CDK_DEFAULT_REGION || productionConfig.region, // Strictly us-east-1
};



// 1. Dedicated VPC & Security Groups
const networkStack = new RallyNetworkStack(app, 'RallyNetworkStack', {
  env,
  config: productionConfig,
  description: 'RALLY VPC and inter-tier security groups (NAT-less, 0 NAT Gateways)',
});

// 2. Private Interface Endpoints for Bedrock, Secrets Manager, ECR, CloudWatch
const endpointsStack = new RallyEndpointsStack(app, 'RallyEndpointsStack', {
  env,
  vpc: networkStack.vpc,
  vpceSecurityGroup: networkStack.vpceSecurityGroup,
  description: 'RALLY AWS Interface & Gateway VPC Endpoints for private connectivity',
});
endpointsStack.addDependency(networkStack);

// 3. PostgreSQL RDS Instance & Secrets Manager
const databaseStack = new RallyDatabaseStack(app, 'RallyDatabaseStack', {
  env,
  config: productionConfig,
  vpc: networkStack.vpc,
  rdsSecurityGroup: networkStack.rdsSecurityGroup,
  description: 'RALLY Amazon RDS PostgreSQL 16.x instance and Secrets Manager credentials',
});
databaseStack.addDependency(networkStack);

// 4. Amazon ECR Repository for container images
const ecrStack = new RallyEcrStack(app, 'RallyEcrStack', {
  env,
  description: 'RALLY Amazon ECR repository for rally-api container images',
});

// 5. ECS Fargate Service & Public Application Load Balancer
const computeStack = new RallyComputeStack(app, 'RallyComputeStack', {
  env,
  config: productionConfig,
  vpc: networkStack.vpc,
  albSecurityGroup: networkStack.albSecurityGroup,
  appSecurityGroup: networkStack.appSecurityGroup,
  repository: ecrStack.repository,
  databaseSecret: databaseStack.databaseSecret,
  description: 'RALLY ECS Fargate single-task service and Public Application Load Balancer',
});
// Explicit cross-stack dependencies:
endpointsStack.addDependency(networkStack);
databaseStack.addDependency(networkStack);
computeStack.addDependency(endpointsStack);
computeStack.addDependency(databaseStack);
computeStack.addDependency(ecrStack);

app.synth();

