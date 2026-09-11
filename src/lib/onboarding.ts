import { Employee } from '@/types';

export interface OnboardingSectionProgress {
  id: 'PERSONAL' | 'WORK_RIGHTS' | 'EMERGENCY' | 'BANKING';
  title: string;
  description: string;
  isDone: boolean;
  missingFields: string[];
}

export interface OnboardingProgressResult {
  completedCount: number;
  totalSections: number;
  percent: number;
  isComplete: boolean;
  sections: OnboardingSectionProgress[];
  missingSectionTitles: string[];
}

/**
 * Validates the 4 required profile sections for staff self-onboarding:
 * 1. Personal Details (mobilePhone, dateOfBirth, address, suburb, postcode)
 * 2. Legal Work Rights (citizenStatus, and visa details if visa holder)
 * 3. Emergency Contact (emergencyNextOfKin, emergencyRelationship, emergencyMobile)
 * 4. Banking & TFN (bankName, bsbMasked/bsbEncrypted, accountNumberMasked/accountNumberEncrypted)
 */
export function getOnboardingProgress(emp: Employee | null | undefined): OnboardingProgressResult {
  if (!emp) {
    return {
      completedCount: 0,
      totalSections: 4,
      percent: 0,
      isComplete: false,
      sections: [],
      missingSectionTitles: [
        'Personal Details',
        'Legal Work Rights',
        'Emergency Contact',
        'Banking & TFN',
      ],
    };
  }

  // 1. Personal & Residential Information
  const missingPersonal: string[] = [];
  if (!emp.mobilePhone?.trim()) missingPersonal.push('Mobile Phone');
  if (!emp.dateOfBirth?.trim()) missingPersonal.push('Date of Birth');
  if (!emp.address?.trim()) missingPersonal.push('Residential Address');
  if (!emp.suburb?.trim()) missingPersonal.push('Suburb');
  if (!emp.postcode?.trim()) missingPersonal.push('Postcode');
  const isPersonalDone = missingPersonal.length === 0;

  // 2. Legal Work Rights & Citizenship
  const missingWorkRights: string[] = [];
  const citizenStr = String(emp.citizenStatus || '').toUpperCase();
  if (!emp.citizenStatus || citizenStr.length === 0) {
    missingWorkRights.push('Citizenship / Visa Status');
  } else if (citizenStr.includes('VISA') || emp.citizenStatus === 'VISA_HOLDER') {
    if (!emp.visaType?.trim()) missingWorkRights.push('Visa Subclass');
    if (!emp.visaExpiryDate?.trim()) missingWorkRights.push('Visa Expiry Date');
  }
  const isWorkRightsDone = missingWorkRights.length === 0;

  // 3. Emergency Contact
  const missingEmergency: string[] = [];
  if (!emp.emergencyNextOfKin?.trim()) missingEmergency.push('Next of Kin Name');
  if (!emp.emergencyRelationship?.trim()) missingEmergency.push('Relationship');
  if (!emp.emergencyMobile?.trim()) missingEmergency.push('Emergency Contact Mobile');
  const isEmergencyDone = missingEmergency.length === 0;

  // 4. Banking & TFN
  const missingBanking: string[] = [];
  if (!emp.bankName?.trim()) missingBanking.push('Bank Name');
  if (!emp.bsbMasked?.trim() && !emp.bsbEncrypted?.trim()) missingBanking.push('BSB Number');
  if (!emp.accountNumberMasked?.trim() && !emp.accountNumberEncrypted?.trim()) missingBanking.push('Account Number');
  const isBankingDone = missingBanking.length === 0;

  const sections: OnboardingSectionProgress[] = [
    {
      id: 'PERSONAL',
      title: 'Personal Details',
      description: 'Mobile, Date of Birth & Residential Address',
      isDone: isPersonalDone,
      missingFields: missingPersonal,
    },
    {
      id: 'WORK_RIGHTS',
      title: 'Legal Work Rights',
      description: 'Australian Citizenship or VEVO Visa Status',
      isDone: isWorkRightsDone,
      missingFields: missingWorkRights,
    },
    {
      id: 'EMERGENCY',
      title: 'Emergency Contact',
      description: 'Emergency contact name, relation & mobile',
      isDone: isEmergencyDone,
      missingFields: missingEmergency,
    },
    {
      id: 'BANKING',
      title: 'Banking & TFN',
      description: 'Bank account, BSB & Superannuation',
      isDone: isBankingDone,
      missingFields: missingBanking,
    },
  ];

  const completedCount = sections.filter(s => s.isDone).length;
  const totalSections = sections.length;
  const percent = Math.round((completedCount / totalSections) * 100);
  const isComplete = completedCount === totalSections;
  const missingSectionTitles = sections.filter(s => !s.isDone).map(s => s.title);

  return {
    completedCount,
    totalSections,
    percent,
    isComplete,
    sections,
    missingSectionTitles,
  };
}
