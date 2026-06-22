import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'super_secret_key_change_in_production',
  microservices: {
    auth: process.env.AUTH_URL || 'http://localhost:3001',
    notifications: process.env.NOTIFICATIONS_URL || 'http://localhost:3002',
    llm: process.env.LLM_URL || 'http://localhost:3003',
    clusteringIntegrator: process.env.CLUSTERING_INTEGRATOR_URL || 'http://localhost:3004',
    clusteringSubject: process.env.CLUSTERING_SUBJECT_URL || 'http://localhost:3005',
    clusteringStudentsInfo: process.env.CLUSTERING_STUDENTS_INFO_URL || 'http://localhost:3006',
    clusteringStudentsGroups: process.env.CLUSTERING_STUDENTS_GROUPS_URL || 'http://localhost:3007',
  }
};
