import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environments';

export interface RallyNetworkStackProps extends cdk.StackProps {
  readonly config: EnvironmentConfig;
}

export class RallyNetworkStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly albSecurityGroup: ec2.ISecurityGroup;
  public readonly appSecurityGroup: ec2.ISecurityGroup;
  public readonly rdsSecurityGroup: ec2.ISecurityGroup;
  public readonly vpceSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: RallyNetworkStackProps) {
    super(scope, id, props);

    // ── Dedicated RALLY VPC (NAT-less: 0 NAT Gateways) ──────────────────────────
    this.vpc = new ec2.Vpc(this, 'RallyVpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.config.vpcCidr),
      availabilityZones: ['us-east-1a', 'us-east-1b'], // Explicit AZs enable 100% offline synthesis without AWS account lookup
      natGateways: 0, // Strict NAT-less architecture: Saves ~$65/mo

      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public-ALB',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private-Isolated-App-DB',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });


    // ── 1. ALB Security Group (Public Ingress) ──────────────────────────────
    const albSg = new ec2.SecurityGroup(this, 'RallyAlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'rally-alb',
      description: 'Allows public HTTP/HTTPS traffic to the RALLY Application Load Balancer',
      allowAllOutbound: false,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow public HTTP for redirect');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow public HTTPS');

    // ── 2. App Security Group (ECS Fargate Private Compute) ──────────────────
    const appSg = new ec2.SecurityGroup(this, 'RallyAppSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'rally-app',
      description: 'Private security group for RALLY ECS Fargate application containers',
      allowAllOutbound: false,
    });

    // ── 3. RDS Security Group (PostgreSQL Private Database) ──────────────────
    const rdsSg = new ec2.SecurityGroup(this, 'RallyRdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'rally-rds',
      description: 'Private security group for RALLY PostgreSQL RDS instance',
      allowAllOutbound: false,
    });

    // ── 4. VPC Endpoints Security Group (Interface Endpoints) ────────────────
    const vpceSg = new ec2.SecurityGroup(this, 'RallyVpceSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'rally-vpce',
      description: 'Security group for AWS Interface VPC Endpoints',
      allowAllOutbound: false,
    });


    // ── Precise Least-Privilege Inter-SG Ingress & Egress ───────────────────
    // ALB -> App on port 8000
    appSg.addIngressRule(albSg, ec2.Port.tcp(props.config.containerPort), 'Allow HTTP ingress from ALB only');
    albSg.addEgressRule(appSg, ec2.Port.tcp(props.config.containerPort), 'Forward traffic to ECS tasks on port 8000');

    // App -> RDS on port 5432 (PostgreSQL)
    rdsSg.addIngressRule(appSg, ec2.Port.tcp(props.config.dbPort), 'Allow PostgreSQL traffic strictly from ECS app');
    appSg.addEgressRule(rdsSg, ec2.Port.tcp(props.config.dbPort), 'Allow egress to RDS PostgreSQL');

    // App -> VPC Endpoints on port 443 (HTTPS for Bedrock, Secrets Manager, ECR, CloudWatch)
    vpceSg.addIngressRule(appSg, ec2.Port.tcp(443), 'Allow HTTPS API calls from ECS app to AWS services');
    appSg.addEgressRule(vpceSg, ec2.Port.tcp(443), 'Allow HTTPS egress to private VPC endpoints');

    // App -> S3 Gateway Endpoint on port 443 (Required for ECS Fargate to download ECR container layers from S3)
    appSg.addEgressRule(
      ec2.Peer.prefixList('pl-63a5400a'),
      ec2.Port.tcp(443),
      'Allow HTTPS egress to S3 Gateway Endpoint for ECR layer pull'
    );

    this.albSecurityGroup = albSg;
    this.appSecurityGroup = appSg;
    this.rdsSecurityGroup = rdsSg;
    this.vpceSecurityGroup = vpceSg;

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId, description: 'RALLY VPC ID' });
  }
}
