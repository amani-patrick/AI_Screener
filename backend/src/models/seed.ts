import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Applicant, Job } from '../models';

dotenv.config();

// =========================================================
// TalentIQ — Seed Script
// Realistic dummy data following Umurava's TalentProfile schema
// =========================================================

const APPLICANTS = [
  {
    fullName: 'Amara Osei',
    email: 'amara.osei@email.com',
    location: { city: 'Accra', country: 'Ghana', remote: true },
    headline: 'Senior Full-Stack Engineer | React & Node.js | 6 Years',
    summary: 'Passionate engineer with 6 years building scalable web applications in fintech and e-commerce. Strong believer in clean code, test-driven development, and empowering African tech talent.',
    skills: [
      { name: 'React', yearsOfExperience: 5, level: 'expert', category: 'technical' },
      { name: 'Node.js', yearsOfExperience: 6, level: 'expert', category: 'technical' },
      { name: 'TypeScript', yearsOfExperience: 4, level: 'advanced', category: 'technical' },
      { name: 'MongoDB', yearsOfExperience: 4, level: 'advanced', category: 'technical' },
      { name: 'AWS', yearsOfExperience: 3, level: 'intermediate', category: 'tool' },
      { name: 'Docker', yearsOfExperience: 3, level: 'intermediate', category: 'tool' },
      { name: 'GraphQL', yearsOfExperience: 2, level: 'intermediate', category: 'technical' },
    ],
    workExperience: [
      {
        company: 'Paystack',
        role: 'Senior Software Engineer',
        startDate: '2021-03-01',
        isCurrent: true,
        description: 'Lead engineer on the merchant dashboard team serving 200k+ businesses.',
        achievements: [
          'Reduced dashboard load time by 65% through code splitting and lazy loading',
          'Architected real-time transaction monitoring system processing 5M+ daily events',
          'Mentored 4 junior engineers through structured growth plans',
        ],
        skills: ['React', 'TypeScript', 'Node.js', 'Redis'],
      },
      {
        company: 'Andela',
        role: 'Software Engineer',
        startDate: '2018-06-01',
        endDate: '2021-02-28',
        isCurrent: false,
        description: 'Placed with US tech clients, building full-stack features for SaaS platforms.',
        achievements: [
          'Delivered 3 major product features adopted by 50k+ users',
          'Improved test coverage from 40% to 85% across 2 projects',
        ],
        skills: ['React', 'Node.js', 'PostgreSQL'],
      },
    ],
    education: [
      { institution: 'University of Ghana', degree: 'BSc', field: 'Computer Science', startYear: 2014, endYear: 2018 },
    ],
    certifications: [
      { name: 'AWS Certified Developer', issuer: 'Amazon', issueDate: '2022-05-01', expiryDate: '2025-05-01' },
    ],
    languages: [{ name: 'English', proficiency: 'native' }, { name: 'Twi', proficiency: 'native' }],
    availability: { immediateStart: false, noticePeriod: 30 },
    source: 'umurava_platform',
  },
  {
    fullName: 'Fatima Al-Rashid',
    email: 'fatima.alrashid@email.com',
    location: { city: 'Nairobi', country: 'Kenya', remote: true },
    headline: 'Machine Learning Engineer | Python & TensorFlow | PhD Candidate',
    summary: 'ML engineer with 4 years of applied research experience in NLP and computer vision. Published researcher committed to building AI that solves real African problems.',
    skills: [
      { name: 'Python', yearsOfExperience: 6, level: 'expert', category: 'technical' },
      { name: 'TensorFlow', yearsOfExperience: 4, level: 'advanced', category: 'technical' },
      { name: 'PyTorch', yearsOfExperience: 3, level: 'advanced', category: 'technical' },
      { name: 'Scikit-learn', yearsOfExperience: 4, level: 'expert', category: 'technical' },
      { name: 'SQL', yearsOfExperience: 4, level: 'intermediate', category: 'technical' },
      { name: 'FastAPI', yearsOfExperience: 2, level: 'intermediate', category: 'technical' },
    ],
    workExperience: [
      {
        company: 'Safaricom',
        role: 'Machine Learning Engineer',
        startDate: '2022-01-01',
        isCurrent: true,
        description: 'Building ML models for fraud detection and customer churn prediction.',
        achievements: [
          'Deployed fraud detection model reducing financial losses by $2.4M annually',
          'Built multilingual NLP system supporting Swahili and English with 94% accuracy',
          'Reduced model inference latency by 70% through quantisation and ONNX conversion',
        ],
        skills: ['Python', 'TensorFlow', 'MLflow', 'Kubernetes'],
      },
      {
        company: 'IBM Research Africa',
        role: 'Research Intern',
        startDate: '2021-06-01',
        endDate: '2021-12-31',
        isCurrent: false,
        description: 'NLP research for low-resource African languages.',
        achievements: ['Co-authored paper accepted at ACL 2022 on Swahili sentiment analysis'],
        skills: ['Python', 'HuggingFace', 'NLP'],
      },
    ],
    education: [
      { institution: 'University of Nairobi', degree: 'PhD (Candidate)', field: 'Artificial Intelligence', startYear: 2021 },
      { institution: 'Strathmore University', degree: 'MSc', field: 'Data Science', startYear: 2019, endYear: 2021 },
    ],
    certifications: [
      { name: 'TensorFlow Developer Certificate', issuer: 'Google', issueDate: '2021-03-01' },
    ],
    languages: [{ name: 'English', proficiency: 'professional' }, { name: 'Swahili', proficiency: 'native' }, { name: 'Arabic', proficiency: 'conversational' }],
    availability: { immediateStart: false, noticePeriod: 60 },
    source: 'umurava_platform',
  },
  {
    fullName: 'Kwame Mensah',
    email: 'kwame.mensah@email.com',
    location: { city: 'Lagos', country: 'Nigeria', remote: false },
    headline: 'Product Manager | B2B SaaS | 5 Years Experience',
    summary: 'Strategic product manager who has taken 3 products from zero to $10M ARR. Expert in user research, roadmap prioritisation, and cross-functional alignment in fast-moving startup environments.',
    skills: [
      { name: 'Product Strategy', yearsOfExperience: 5, level: 'expert', category: 'domain' },
      { name: 'User Research', yearsOfExperience: 5, level: 'expert', category: 'domain' },
      { name: 'SQL', yearsOfExperience: 3, level: 'intermediate', category: 'technical' },
      { name: 'Figma', yearsOfExperience: 4, level: 'advanced', category: 'tool' },
      { name: 'JIRA', yearsOfExperience: 5, level: 'expert', category: 'tool' },
      { name: 'Data Analysis', yearsOfExperience: 4, level: 'advanced', category: 'domain' },
      { name: 'Agile/Scrum', yearsOfExperience: 5, level: 'expert', category: 'domain' },
    ],
    workExperience: [
      {
        company: 'Flutterwave',
        role: 'Senior Product Manager',
        startDate: '2020-09-01',
        isCurrent: true,
        description: 'Owning the payment links and invoicing product line serving SMBs across Africa.',
        achievements: [
          'Grew payment links feature adoption by 180% through redesign based on user research',
          'Launched invoicing product in 6 markets, achieving $4M ARR in 12 months',
          'Led cross-functional team of 12 across engineering, design, and marketing',
        ],
        skills: ['Product Strategy', 'User Research', 'SQL', 'Figma'],
      },
      {
        company: 'Cowrywise',
        role: 'Product Manager',
        startDate: '2019-01-01',
        endDate: '2020-08-31',
        isCurrent: false,
        description: 'Managed the savings and investments product for Nigeria\'s growing retail investor base.',
        achievements: [
          'Increased user retention by 34% by introducing goal-based saving features',
          'Reduced onboarding drop-off by 45% through A/B testing and UX improvements',
        ],
        skills: ['Product Management', 'A/B Testing', 'Analytics'],
      },
    ],
    education: [
      { institution: 'Lagos Business School', degree: 'MBA', field: 'Business Administration', startYear: 2017, endYear: 2019 },
      { institution: 'University of Benin', degree: 'BSc', field: 'Computer Engineering', startYear: 2012, endYear: 2016 },
    ],
    certifications: [
      { name: 'Certified Product Manager', issuer: 'Product School', issueDate: '2020-01-01' },
    ],
    languages: [{ name: 'English', proficiency: 'native' }, { name: 'Yoruba', proficiency: 'conversational' }],
    availability: { immediateStart: false, noticePeriod: 45 },
    source: 'umurava_platform',
  },
  {
    fullName: 'Nadia Kamara',
    email: 'nadia.kamara@email.com',
    location: { city: 'Kigali', country: 'Rwanda', remote: true },
    headline: 'UI/UX Designer | Design Systems | 4 Years',
    summary: 'User-centred designer specialising in B2B SaaS design systems and mobile-first African market products. Fluent in translating complex workflows into intuitive experiences.',
    skills: [
      { name: 'Figma', yearsOfExperience: 4, level: 'expert', category: 'tool' },
      { name: 'UX Research', yearsOfExperience: 4, level: 'advanced', category: 'domain' },
      { name: 'Design Systems', yearsOfExperience: 3, level: 'advanced', category: 'domain' },
      { name: 'Prototyping', yearsOfExperience: 4, level: 'expert', category: 'domain' },
      { name: 'CSS', yearsOfExperience: 2, level: 'intermediate', category: 'technical' },
      { name: 'Adobe Creative Suite', yearsOfExperience: 5, level: 'advanced', category: 'tool' },
    ],
    workExperience: [
      {
        company: 'MTN Rwanda',
        role: 'Senior UX Designer',
        startDate: '2022-02-01',
        isCurrent: true,
        description: 'Lead designer for MTN\'s digital financial services apps serving 3M+ users.',
        achievements: [
          'Redesigned MoMo app onboarding reducing drop-off by 52%',
          'Created comprehensive design system with 200+ components adopted across 4 products',
          'Improved app store rating from 3.2 to 4.6 through systematic UX improvements',
        ],
        skills: ['Figma', 'User Research', 'Design Systems'],
      },
      {
        company: 'Irembo',
        role: 'UX Designer',
        startDate: '2020-06-01',
        endDate: '2022-01-31',
        isCurrent: false,
        description: 'Designed Rwanda\'s national e-government platform used by 4M+ citizens.',
        achievements: ['Improved task completion rate by 40% for complex government service applications'],
        skills: ['Figma', 'User Testing', 'Accessibility'],
      },
    ],
    education: [
      { institution: 'Carnegie Mellon University Africa', degree: 'MSc', field: 'Information Technology', startYear: 2018, endYear: 2020 },
    ],
    certifications: [
      { name: 'Google UX Design Certificate', issuer: 'Google', issueDate: '2020-08-01' },
    ],
    languages: [{ name: 'English', proficiency: 'professional' }, { name: 'Kinyarwanda', proficiency: 'native' }, { name: 'French', proficiency: 'professional' }],
    availability: { immediateStart: true },
    source: 'umurava_platform',
  },
  {
    fullName: 'Emmanuel Diallo',
    email: 'emmanuel.diallo@email.com',
    location: { city: 'Dakar', country: 'Senegal', remote: true },
    headline: 'Backend Engineer | Java & Spring Boot | Fintech Specialist',
    summary: 'Backend engineer with 7 years in high-throughput payment systems. Strong expertise in microservices architecture, event-driven systems, and PCI-DSS compliance.',
    skills: [
      { name: 'Java', yearsOfExperience: 7, level: 'expert', category: 'technical' },
      { name: 'Spring Boot', yearsOfExperience: 6, level: 'expert', category: 'technical' },
      { name: 'Kafka', yearsOfExperience: 4, level: 'advanced', category: 'technical' },
      { name: 'PostgreSQL', yearsOfExperience: 6, level: 'advanced', category: 'technical' },
      { name: 'Kubernetes', yearsOfExperience: 3, level: 'intermediate', category: 'tool' },
      { name: 'Redis', yearsOfExperience: 4, level: 'advanced', category: 'technical' },
    ],
    workExperience: [
      {
        company: 'Wave Mobile Money',
        role: 'Staff Backend Engineer',
        startDate: '2019-11-01',
        isCurrent: true,
        description: 'Core platform engineer for Wave\'s payment processing system handling $1B+ monthly volume.',
        achievements: [
          'Engineered idempotency layer reducing duplicate transactions to near-zero',
          'Led migration from monolith to microservices, improving deploy frequency by 10x',
          'Built real-time settlement engine processing 2M transactions per day',
        ],
        skills: ['Java', 'Kafka', 'PostgreSQL', 'Kubernetes'],
      },
    ],
    education: [
      { institution: 'Université Cheikh Anta Diop', degree: 'MSc', field: 'Software Engineering', startYear: 2014, endYear: 2016 },
    ],
    certifications: [
      { name: 'Java SE 17 Developer', issuer: 'Oracle', issueDate: '2022-09-01' },
      { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', issueDate: '2023-01-01' },
    ],
    languages: [{ name: 'English', proficiency: 'professional' }, { name: 'French', proficiency: 'native' }, { name: 'Wolof', proficiency: 'native' }],
    availability: { immediateStart: false, noticePeriod: 30 },
    source: 'umurava_platform',
  },
  {
    fullName: 'Priya Nkosi',
    email: 'priya.nkosi@email.com',
    location: { city: 'Cape Town', country: 'South Africa', remote: true },
    headline: 'Data Engineer | dbt & Airflow | 5 Years',
    summary: 'Data engineer who has built 10+ production data pipelines serving millions of daily users. Expert in modern data stack (dbt, Airflow, Snowflake) and real-time streaming architectures.',
    skills: [
      { name: 'Python', yearsOfExperience: 5, level: 'advanced', category: 'technical' },
      { name: 'dbt', yearsOfExperience: 3, level: 'expert', category: 'tool' },
      { name: 'Apache Airflow', yearsOfExperience: 4, level: 'advanced', category: 'tool' },
      { name: 'Snowflake', yearsOfExperience: 3, level: 'advanced', category: 'tool' },
      { name: 'SQL', yearsOfExperience: 5, level: 'expert', category: 'technical' },
      { name: 'Spark', yearsOfExperience: 3, level: 'intermediate', category: 'technical' },
      { name: 'Kafka', yearsOfExperience: 2, level: 'intermediate', category: 'technical' },
    ],
    workExperience: [
      {
        company: 'Takealot',
        role: 'Senior Data Engineer',
        startDate: '2021-04-01',
        isCurrent: true,
        description: 'Building and maintaining data infrastructure for South Africa\'s largest e-commerce platform.',
        achievements: [
          'Reduced ETL pipeline failure rate from 15% to 0.3% through robust error handling',
          'Built real-time inventory availability pipeline serving 8M product listings',
          'Migrated legacy Hadoop cluster to modern Snowflake/dbt stack saving $400k annually',
        ],
        skills: ['dbt', 'Snowflake', 'Airflow', 'SQL'],
      },
      {
        company: 'Discovery Limited',
        role: 'Data Engineer',
        startDate: '2019-07-01',
        endDate: '2021-03-31',
        isCurrent: false,
        description: 'Data engineering for health and life insurance analytics.',
        achievements: ['Built predictive claims model reducing fraudulent claims by $1.2M/year'],
        skills: ['Python', 'Spark', 'SQL'],
      },
    ],
    education: [
      { institution: 'University of Cape Town', degree: 'BSc (Hons)', field: 'Computer Science', startYear: 2015, endYear: 2019 },
    ],
    certifications: [
      { name: 'dbt Analytics Engineer Certification', issuer: 'dbt Labs', issueDate: '2022-11-01' },
      { name: 'SnowPro Core', issuer: 'Snowflake', issueDate: '2023-03-01' },
    ],
    languages: [{ name: 'English', proficiency: 'native' }, { name: 'Zulu', proficiency: 'conversational' }],
    availability: { immediateStart: false, noticePeriod: 30 },
    source: 'umurava_platform',
  },
];

const JOBS = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    company: 'Umurava',
    location: 'Kigali, Rwanda',
    remote: true,
    employmentType: 'full-time',
    experienceLevel: 'senior',
    description: 'We are looking for a Senior Full-Stack Engineer to join our core product team building the next generation of our talent marketplace platform. You will own end-to-end features from database design through to pixel-perfect UI.',
    responsibilities: [
      'Design and build scalable backend APIs using Node.js and TypeScript',
      'Develop performant React frontends with great UX',
      'Collaborate with product and design on technical feasibility',
      'Review code and mentor junior engineers',
      'Contribute to architectural decisions and technical roadmap',
    ],
    requiredSkills: [
      { name: 'React', yearsRequired: 3, mandatory: true, weight: 5 },
      { name: 'Node.js', yearsRequired: 4, mandatory: true, weight: 5 },
      { name: 'TypeScript', yearsRequired: 2, mandatory: true, weight: 4 },
      { name: 'MongoDB', yearsRequired: 2, mandatory: true, weight: 3 },
      { name: 'Docker', yearsRequired: 1, mandatory: false, weight: 2 },
    ],
    niceToHaveSkills: ['GraphQL', 'AWS', 'Redis', 'Kubernetes'],
    requiredEducation: 'BSc in Computer Science or related field',
    requiredExperienceYears: 5,
    shortlistSize: 10,
    createdBy: 'demo-recruiter',
  },
  {
    title: 'Machine Learning Engineer',
    department: 'AI & Data',
    company: 'Umurava',
    location: 'Remote Africa',
    remote: true,
    employmentType: 'full-time',
    experienceLevel: 'mid',
    description: 'Join our AI team to build intelligent features that power talent matching, skill assessments, and career recommendations for African tech professionals.',
    responsibilities: [
      'Design, train, and deploy ML models for talent matching',
      'Build NLP pipelines for profile analysis and job-candidate fit scoring',
      'Collaborate with the product team to translate ML insights into product features',
      'Maintain model performance and monitoring in production',
    ],
    requiredSkills: [
      { name: 'Python', yearsRequired: 3, mandatory: true, weight: 5 },
      { name: 'TensorFlow', yearsRequired: 2, mandatory: true, weight: 4 },
      { name: 'Scikit-learn', yearsRequired: 2, mandatory: true, weight: 4 },
      { name: 'SQL', yearsRequired: 2, mandatory: true, weight: 3 },
    ],
    niceToHaveSkills: ['PyTorch', 'MLflow', 'Kubernetes', 'FastAPI', 'NLP'],
    requiredEducation: 'MSc in Computer Science, AI, or related field',
    requiredExperienceYears: 3,
    shortlistSize: 10,
    createdBy: 'demo-recruiter',
  },
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talentiq';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Applicant.deleteMany({});
  await Job.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Insert applicants
  const insertedApplicants = await Applicant.insertMany(APPLICANTS);
  console.log(`✅ Inserted ${insertedApplicants.length} applicants`);

  // Insert jobs
  const insertedJobs = await Job.insertMany(JOBS);
  console.log(`✅ Inserted ${insertedJobs.length} jobs`);

  console.log('\n🌱 Seed complete! IDs:');
  insertedApplicants.forEach((a) => console.log(`  Applicant: ${a.fullName} → ${a._id}`));
  insertedJobs.forEach((j) => console.log(`  Job: ${j.title} → ${j._id}`));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});