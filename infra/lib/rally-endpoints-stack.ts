import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface RallyEndpointsStackProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc;
  readonly vpceSecurityGroup: ec2.ISecurityGroup;
}

export class RallyEndpointsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RallyEndpointsStackProps) {
    super(scope, id, props);

    const subnets: ec2.SubnetSelection = {
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    };

    // ── 1. Bedrock Runtime Interface Endpoint ──────────────────────────────────
    // Enables private boto3 converse() calls without internet or NAT Gateway
    new ec2.InterfaceVpcEndpoint(this, 'BedrockRuntimeEndpoint', {
      vpc: props.vpc,
      service: new ec2.InterfaceVpcEndpointService('com.amazonaws.us-east-1.bedrock-runtime'),
      subnets,
      securityGroups: [props.vpceSecurityGroup],
      privateDnsEnabled: true,
    });

    // ── 2. Secrets Manager Interface Endpoint ────────────────────────────────
    // Enables private database secret retrieval by AWSSecretsManagerProvider
    new ec2.InterfaceVpcEndpoint(this, 'SecretsManagerEndpoint', {
      vpc: props.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets,
      securityGroups: [props.vpceSecurityGroup],
      privateDnsEnabled: true,
    });

    // ── 3. ECR API Interface Endpoint ────────────────────────────────────────
    // Enables ECS agent to authenticate and query image manifests privately
    new ec2.InterfaceVpcEndpoint(this, 'EcrApiEndpoint', {
      vpc: props.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      subnets,
      securityGroups: [props.vpceSecurityGroup],
      privateDnsEnabled: true,
    });

    // ── 4. ECR DKR Interface Endpoint ────────────────────────────────────────
    // Enables ECS agent to pull container image layers privately
    new ec2.InterfaceVpcEndpoint(this, 'EcrDkrEndpoint', {
      vpc: props.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets,
      securityGroups: [props.vpceSecurityGroup],
      privateDnsEnabled: true,
    });

    // ── 5. CloudWatch Logs Interface Endpoint ────────────────────────────────
    // Enables awslogs log driver to push structured application logs privately
    new ec2.InterfaceVpcEndpoint(this, 'CloudWatchLogsEndpoint', {
      vpc: props.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets,
      securityGroups: [props.vpceSecurityGroup],
      privateDnsEnabled: true,
    });

    // ── 6. Amazon S3 Gateway Endpoint ────────────────────────────────────────
    // ECR image layers are stored in Amazon S3 buckets. Gateway endpoint is FREE ($0.00)
    new ec2.GatewayVpcEndpoint(this, 'S3GatewayEndpoint', {
      vpc: props.vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [subnets],
    });
  }
}
