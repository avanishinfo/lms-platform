import { PrismaClient, CourseLevel, LearnerStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@arifac.com' },
    update: {
      role: 'ADMIN',
    },
    create: {
      name: 'ARIFAC Admin',
      email: 'admin@arifac.com',
      phone: '+91-9000000000',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create sample learner
  const learnerPassword = await bcrypt.hash('learner123', 10)
  const learnerUser = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {
      role: 'LEARNER',
      learner: {
        upsert: {
          update: {},
          create: {
            status: 'REGISTERED',
          },
        },
      },
    },
    create: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91-9876543210',
      password: learnerPassword,
      role: 'LEARNER',
      learner: {
        create: {
          status: 'REGISTERED',
        },
      },
    },
  })
  console.log('✅ Sample learner created:', learnerUser.email)

  // Create courses
  const courses = [
    {
      name: 'Foundation in Regulatory Affairs',
      description: 'Entry-level course covering the basics of regulatory affairs in healthcare and pharmaceuticals.',
      level: CourseLevel.L1,
      price: 4999,
      duration: 20,
    },
    {
      name: 'Regulatory Affairs Professional',
      description: 'Intermediate course for professionals seeking to deepen their regulatory knowledge.',
      level: CourseLevel.L2,
      price: 9999,
      duration: 40,
    },
    {
      name: 'Advanced Regulatory Specialist',
      description: 'Advanced topics including CTD, dossier preparation, and global regulatory strategies.',
      level: CourseLevel.L3,
      price: 14999,
      duration: 60,
    },
    {
      name: 'Regulatory Affairs Manager',
      description: 'Leadership and management in regulatory affairs including team coordination.',
      level: CourseLevel.L4,
      price: 19999,
      duration: 80,
    },
    {
      name: 'Regulatory Affairs Expert',
      description: 'Expert-level strategic regulatory guidance and advanced compliance topics.',
      level: CourseLevel.L5,
      price: 24999,
      duration: 100,
    },
  ]

  const createdCourses: Array<{ id: string }> = []
  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { id: courseData.level },
      update: courseData,
      create: {
        id: courseData.level,
        ...courseData,
      },
    })
    createdCourses.push(course)
    console.log(`✅ Course created: ${courseData.name} (${courseData.level})`)
  }

  // Create study materials for each course
  for (const course of createdCourses) {
    const existingMaterials = await prisma.studyMaterial.count({ where: { courseId: course.id } })
    if (existingMaterials === 0) {
      await prisma.studyMaterial.createMany({
        data: [
          {
            courseId: course.id,
            title: 'Introduction to Regulatory Affairs',
            content: `# Introduction to Regulatory Affairs\n\nRegulatory affairs (RA) is a profession within regulated industries, such as pharmaceuticals, medical devices, agrochemicals, energy, banking, telecom, and so on.\n\n## Key Concepts\n\n- **Regulatory Compliance**: Ensuring products and services meet legal requirements\n- **Documentation**: Preparing and maintaining regulatory submissions\n- **Risk Management**: Identifying and mitigating regulatory risks\n\n## Why Regulatory Affairs Matters\n\nRegulatory affairs ensures that products reaching consumers are safe, effective, and of high quality. RA professionals act as a bridge between companies and regulatory authorities.\n\n## Learning Objectives\n\nBy the end of this module, you will be able to:\n1. Define regulatory affairs and its scope\n2. Understand the role of RA professionals\n3. Identify key regulatory bodies globally`,
            order: 1,
          },
          {
            courseId: course.id,
            title: 'Global Regulatory Landscape',
            content: `# Global Regulatory Landscape\n\n## Major Regulatory Bodies\n\n### FDA (USA)\nThe Food and Drug Administration regulates drugs, biologics, medical devices, food, and cosmetics in the United States.\n\n### EMA (Europe)\nThe European Medicines Agency facilitates the development and ensures the quality, safety, and efficacy of medicines in the EU.\n\n### CDSCO (India)\nThe Central Drugs Standard Control Organisation is the national regulatory body of India for pharmaceuticals and medical devices.\n\n### WHO\nThe World Health Organization provides international standards and guidelines for medicines and healthcare products.\n\n## Harmonization Efforts\n\n- **ICH Guidelines**: International Council for Harmonisation of Technical Requirements\n- **WHO Prequalification**: For global access to quality medicines\n- **PIC/S**: Pharmaceutical Inspection Co-operation Scheme`,
            order: 2,
          },
          {
            courseId: course.id,
            title: 'Drug Registration Process',
            content: `# Drug Registration Process\n\n## Overview\n\nDrug registration is the process by which a drug product is evaluated and approved for marketing by a regulatory authority.\n\n## Steps in Drug Registration\n\n1. **Pre-submission meeting**: Discussing the development plan with regulators\n2. **IND/CTA filing**: Filing for clinical trials\n3. **Phase I-III Clinical Trials**: Testing safety and efficacy\n4. **NDA/MAA submission**: New Drug Application / Marketing Authorisation Application\n5. **Review and approval**: Regulatory assessment\n6. **Post-market surveillance**: Ongoing safety monitoring\n\n## Common Dossier Formats\n\n- **CTD (Common Technical Document)**: Globally harmonized format\n  - Module 1: Regional information\n  - Module 2: Summaries\n  - Module 3: Quality\n  - Module 4: Non-clinical study reports\n  - Module 5: Clinical study reports`,
            order: 3,
          },
        ],
      })
    }
  }
  console.log('✅ Study materials created')

  // Create assessments for each course
  for (const course of createdCourses) {
    const existingAssessments = await prisma.assessment.count({ where: { courseId: course.id } })
    if (existingAssessments === 0) {
      const practiceAssessment = await prisma.assessment.create({
        data: {
          courseId: course.id,
          type: 'PRACTICE',
          title: 'Practice Quiz',
          duration: 30,
          passMark: 60,
          questions: {
            create: [
              {
                text: 'What is the primary purpose of regulatory affairs?',
                optionA: 'To increase company profits',
                optionB: 'To ensure products are safe, effective, and compliant',
                optionC: 'To reduce manufacturing costs',
                optionD: 'To promote products in the market',
                correctOption: 'B',
                order: 1,
              },
              {
                text: 'Which body regulates pharmaceuticals in the United States?',
                optionA: 'EMA',
                optionB: 'CDSCO',
                optionC: 'FDA',
                optionD: 'WHO',
                correctOption: 'C',
                order: 2,
              },
              {
                text: 'CTD stands for:',
                optionA: 'Central Technical Document',
                optionB: 'Common Technical Document',
                optionC: 'Clinical Trial Data',
                optionD: 'Certified Technical Dossier',
                correctOption: 'B',
                order: 3,
              },
              {
                text: 'What does GMP stand for?',
                optionA: 'Good Medical Practice',
                optionB: 'General Manufacturing Protocol',
                optionC: 'Good Manufacturing Practice',
                optionD: 'Global Medicine Policy',
                correctOption: 'C',
                order: 4,
              },
              {
                text: 'ICH stands for:',
                optionA: 'International Clinical Harmonisation',
                optionB: 'International Council for Harmonisation',
                optionC: 'Integrated Compliance Handbook',
                optionD: 'Indian Chemical Handbook',
                correctOption: 'B',
                order: 5,
              },
            ],
          },
        },
      })

      const mainAssessment = await prisma.assessment.create({
        data: {
          courseId: course.id,
          type: 'MAIN',
          title: 'Main Examination',
          duration: 60,
          passMark: 70,
          questions: {
            create: [
              {
                text: 'Which phase of clinical trials primarily tests drug safety in humans?',
                optionA: 'Phase II',
                optionB: 'Phase III',
                optionC: 'Phase I',
                optionD: 'Phase IV',
                correctOption: 'C',
                order: 1,
              },
              {
                text: 'What is the purpose of pharmacovigilance?',
                optionA: 'Drug development',
                optionB: 'Post-market safety monitoring',
                optionC: 'Pre-clinical testing',
                optionD: 'Market authorization',
                correctOption: 'B',
                order: 2,
              },
              {
                text: 'A SAE in clinical trials stands for:',
                optionA: 'Standard Assessment Event',
                optionB: 'Systematic Adverse Effect',
                optionC: 'Serious Adverse Event',
                optionD: 'Study Activity Endpoint',
                correctOption: 'C',
                order: 3,
              },
              {
                text: 'Which document describes the ethical principles in clinical research?',
                optionA: 'ICH E6 (GCP)',
                optionB: 'ICH Q8',
                optionC: 'FDA Guidance 21 CFR',
                optionD: 'WHO Technical Report',
                correctOption: 'A',
                order: 4,
              },
              {
                text: 'What is "bridging study" in regulatory terms?',
                optionA: 'A study connecting two clinical phases',
                optionB: 'A study to extrapolate data from one region to another',
                optionC: 'A study on drug interactions',
                optionD: 'A study on manufacturing processes',
                correctOption: 'B',
                order: 5,
              },
              {
                text: 'ANDA stands for:',
                optionA: 'Annual New Drug Application',
                optionB: 'Abbreviated New Drug Application',
                optionC: 'Advanced New Drug Authorization',
                optionD: 'Approved New Drug Announcement',
                correctOption: 'B',
                order: 6,
              },
              {
                text: 'What is the primary focus of Module 3 in CTD?',
                optionA: 'Clinical study reports',
                optionB: 'Non-clinical reports',
                optionC: 'Quality (chemistry, manufacturing, and controls)',
                optionD: 'Regional information',
                correctOption: 'C',
                order: 7,
              },
            ],
          },
        },
      })
      console.log(`✅ Assessments created for course ${course.id}`)
    }
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
