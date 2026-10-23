import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environments';

export interface RallyIamStackProps extends cdk.StackProps {
  readonly config: EnvironmentConfig;
  readonly databaseSecret: secretsmanager.ISecret;
}

export class RallyIamStack extends cdk.Stack {
  public readonly taskExecutionRole: iam.IRole;
  public readonly taskRole: iam.IRole;

  constructor(scope: Construct, id: string, props: RallyIamStackProps) {
    super(scope, id, props);

    // ── 1. ECS Task Execution Role (ECR Image Pull & CloudWatch Logs Agent) ──
    // Assumed by ECS container agent before starting user container
    this.taskExecutionRole = new iam.Role(this, 'RallyTaskExecutionRole', {
      roleName: 'RallyEcsTaskExecutionRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Used by ECS agent to pull container images from ECR and stream logs to CloudWatch',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // ── 2. ECS Task Role (RALLY Application Runtime Permissions) ────────────
    // Assumed by the running RALLY FastAPI container process
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

    new cdk.CfnOutput(this, 'TaskExecutionRoleArn', {
      value: this.taskExecutionRole.roleArn,
      description: 'ECS Task Execution Role ARN',
    });
    new cdk.CfnOutput(this, 'TaskRoleArn', {
      value: this.taskRole.roleArn,
      description: 'ECS Task Role ARN',
    });
  }
}
