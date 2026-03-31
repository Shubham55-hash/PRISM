import { prisma } from '../db/prisma';

export async function analyzeUserLifeEvents(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      documents: true,
      predictions: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const newPredictions = [];

  // Age calculation
  let age = 0;
  if (user.dateOfBirth) {
    const dob = new Date(user.dateOfBirth);
    const diff = Date.now() - dob.getTime();
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  const hasEduDocs = user.documents.some((d) => d.documentType === 'education');
  const hasEmpDocs = user.documents.some((d) => d.documentType === 'employment');
  const hasMedical = user.documents.some((d) => d.documentType === 'medical');
  const hasFinancial = user.documents.some((d) => d.documentType === 'financial');

  // Rule 1: Job Search (Education docs but no employment docs, or age 21-25)
  if ((hasEduDocs && !hasEmpDocs) || (age >= 21 && age <= 25 && !hasEmpDocs)) {
    newPredictions.push({
      userId,
      predictedStage: 'job_search',
      title: 'Job Search Bundle',
      description: 'Education records detected without current employment history. Prepare your job application KYC pack.',
      confidence: 0.85,
      suggestedBundle: JSON.stringify(['education', 'identity', 'address']),
    });
  }

  // Rule 2: Insurance Planning (Age > 25, no medical docs)
  if (age > 25 && !hasMedical) {
    newPredictions.push({
      userId,
      predictedStage: 'insurance_planning',
      title: 'Health Insurance Setup',
      description: 'Based on your age profile, having health insurance is recommended. Prepare your medical history bundle.',
      confidence: 0.65,
      suggestedBundle: JSON.stringify(['identity', 'medical', 'address']),
    });
  }

  // Rule 3: Bank Account / KYC (Employment docs exist but no financial)
  if (hasEmpDocs && !hasFinancial) {
    newPredictions.push({
      userId,
      predictedStage: 'bank_account_setup',
      title: 'Payroll Bank Account',
      description: 'Employment records found. You might need to set up a salaried bank account soon.',
      confidence: 0.75,
      suggestedBundle: JSON.stringify(['identity', 'address', 'employment', 'pan']),
    });
  }

  // Rule 4: Home Loan (Financials exist, Age > 28)
  // (We use 0.82 confidence to make it look distinct from the seeded 0.87 if regenerated)
  if (hasFinancial && age >= 28) {
    newPredictions.push({
      userId,
      predictedStage: 'home_loan',
      title: 'Home Loan Application Bundle',
      description: 'Financial stability patterns detected. PRISM can pre-package your home loan credential pack.',
      confidence: 0.82,
      suggestedBundle: JSON.stringify(['financial', 'employment', 'identity', 'address']),
    });
  }

  const createdPredictions = [];

  // Persist new predictions if they don't already exist for this stage
  for (const pred of newPredictions) {
    const alreadyExists = user.predictions.find((p) => p.predictedStage === pred.predictedStage);
    if (!alreadyExists) {
      const created = await prisma.lifeStagePrediction.create({
        data: {
          userId: pred.userId,
          predictedStage: pred.predictedStage,
          title: pred.title,
          description: pred.description,
          confidence: pred.confidence,
          suggestedBundle: pred.suggestedBundle,
        },
      });
      createdPredictions.push(created);

      // Log the activity
      await prisma.activityLog.create({
         data: {
           userId: pred.userId,
           eventType: 'system',
           title: 'New Life Insight Detected',
           description: `Our AI detected a potential life event: ${pred.title}`,
           entityName: 'PRISM Predictive Engine',
           entityType: 'ai_model',
         }
      });
    } else {
        // Optionally update existing confidence if it changed drastically, but for MVP keep existing
    }
  }

  return createdPredictions;
}
