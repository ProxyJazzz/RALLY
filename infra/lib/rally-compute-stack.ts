import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

import { EnvironmentConfig } from '../config/environments';

export interface RallyComputeStackProps extends cdk.StackProps {
  readonly config: EnvironmentConfig;
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly appSecurityGroup: ec2.ISecurityGroup;
  readonly repository: ecr.IRepository;
  readonly databaseSecret: secretsmanager.ISecret;
}

export class RallyComputeStack extends cdk.Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly ecsService: ecs.FargateService;
  public readonly taskExecutionRole: iam.IRole;
  public readonly taskRole: iam.IRole;

  constructor(scope: Construct, id: string, props: RallyComputeStackProps) {
    super(scope, id, props);

    // ── 1. CloudWatch Log Group for ECS Container ───────────────────────────
    const logGroup = new logs.LogGroup(this, 'RallyApiLogGroup', {
      logGroupName: '/rally/production/api',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── 2. ECS Task Execution Role (ECR Image Pull & CloudWatch Logs Agent) ──
    this.taskExecutionRole = new iam.Role(this, 'RallyTaskExecutionRole', {
      roleName: 'RallyEcsTaskExecutionRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Used by ECS agent to pull container images from ECR and stream logs to CloudWatch',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // ── 3. ECS Task Role (RALLY Application Runtime Permissions) ────────────
    const taskAppRole = new iam.Role(this, 'RallyTaskRole', {
      roleName: 'RallyEcsTaskRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Runtime role for RALLY application with least-privilege Bedrock & Secrets Manager access',
    });

    // Least-privilege Amazon Bedrock Invoke Model access (scoped strictly to Claude 3.5 Sonnet)
    taskAppRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'BedrockInvokeModelAccess',
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          `arn:aws:bedrock:${props.config.region}::foundation-model/${props.config.bedrockModelId}`,
        ],
      })
    );

    // Least-privilege Secrets Manager access (scoped strictly to RALLY database secret)
    props.databaseSecret.grantRead(taskAppRole);
    this.taskRole = taskAppRole;

    // ── 4. Amazon ECS Cluster ────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'RallyCluster', {
      clusterName: 'rally-production-cluster',
      vpc: props.vpc,
      enableFargateCapacityProviders: true,
    });

    // ── 5. ECS Fargate Task Definition (0.25 vCPU, 0.5 GB RAM) ──────────────
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'RallyTaskDefinition', {
      cpu: props.config.containerCpu,
      memoryLimitMiB: props.config.containerMemoryLimitMiB,
      executionRole: this.taskExecutionRole,
      taskRole: this.taskRole,
    });


    // Container specification using ECR repository & non-root user
    const container = taskDefinition.addContainer('rally-api-container', {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'rally-api',
      }),
      environment: {
        APP_ENV: 'production',
        APP_HOST: '0.0.0.0',
        APP_PORT: String(props.config.containerPort),
        LOG_LEVEL: 'INFO',
        AWS_REGION: props.config.region,
        AWS_DEFAULT_REGION: props.config.region,
        BEDROCK_MODEL_ID: props.config.bedrockModelId,
        SECRETS_BACKEND: 'aws_secrets_manager',
        DATABASE_SECRET_ID: '/rally/production/database',
        DB_POOL_SIZE: '5',
        DB_MAX_OVERFLOW: '10',
        OTEL_SERVICE_NAME: 'rally-api',
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8000/liveness || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(15),
      },
      essential: true,
    });

    container.addPortMappings({
      containerPort: props.config.containerPort,
      protocol: ecs.Protocol.TCP,
    });

    // ── 4. ECS Fargate Service (Single task in Private Isolated Subnets) ────
    this.ecsService = new ecs.FargateService(this, 'RallyFargateService', {
      cluster,
      taskDefinition,
      desiredCount: 1, // Single-task for hackathon cost control
      securityGroups: [props.appSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      assignPublicIp: false, // Strictly NO public IP
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    // ── 5. Public Application Load Balancer (Public Subnets) ────────────────
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'RallyAlb', {
      loadBalancerName: 'rally-public-alb',
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // HTTP Port 80 Listener forwarding to ECS Target Group
    // (In production with a verified domain, this redirects to HTTPS Port 443 with an ACM cert)
    const listener = this.alb.addListener('RallyHttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      open: true,
    });

    const targetGroup = listener.addTargets('RallyEcsTarget', {
      port: props.config.containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.ecsService],
      targetGroupName: 'tg-rally-api',
      healthCheck: {
        path: '/liveness', // Lightweight process liveness check (200 OK)
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(10),
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'Public Application Load Balancer DNS Name',
    });
    new cdk.CfnOutput(this, 'TargetGroupArn', {
      value: targetGroup.targetGroupArn,
      description: 'ALB Target Group ARN',
    });
  }
}
