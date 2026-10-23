export interface EnvironmentConfig {
  readonly envName: string;
  readonly region: string;
  readonly vpcCidr: string;
  readonly maxAzs: number;
  readonly dbName: string;
  readonly dbUsername: string;
  readonly dbPort: number;
  readonly dbAllocatedStorageGb: number;
  readonly dbMaxAllocatedStorageGb: number;
  readonly containerPort: number;
  readonly containerCpu: number;
  readonly containerMemoryLimitMiB: number;
  readonly bedrockModelId: string;
}

export const productionConfig: EnvironmentConfig = {
  envName: 'production',
  region: 'us-east-1', // Explicitly locked to us-east-1
  vpcCidr: '10.0.0.0/16',
  maxAzs: 2,
  dbName: 'rally',
  dbUsername: 'rally_app',
  dbPort: 5432,
  dbAllocatedStorageGb: 20,
  dbMaxAllocatedStorageGb: 100,
  containerPort: 8000,
  containerCpu: 256, // 0.25 vCPU
  containerMemoryLimitMiB: 512, // 0.5 GB RAM
  bedrockModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
};
