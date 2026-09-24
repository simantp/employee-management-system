import { Employee, DocumentTypeConfig } from '@/types';
import { INITIAL_DOCUMENT_TYPES } from '@/lib/initialData';

export interface OnboardingSectionProgress {
  id: 'PERSONAL' | 'WORK_RIGHTS' | 'EMERGENCY' | 'BANKING' | 'DOCUMENTS';
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
  missingDocuments: string[];
  requiredDocumentTypes: DocumentTypeConfig[];
}

/**
 * Validates the required profile sections for staff self-onboarding:
 * 1. Personal Details (mobilePhone, dateOfBirth, address, suburb, postcode)
 * 2. Legal Work Rights (citizenStatus, and visa details if visa holder)
 * 3. Emergency Contact (emergencyNextOfKin, emergencyRelationship, emergencyMobile)
 * 4. Banking & TFN (bankName, bsb, accountNumber)
 * 5. Compulsory Documents (any document types configured as isRequired: true)
 */
export function getOnboardingProgress(
  emp: Employee | null | undefined,
  docTypes?: DocumentTypeConfig[]
): OnboardingProgressResult {
  let effectiveDocTypes = docTypes;
  if ((!effectiveDocTypes || effectiveDocTypes.length === 0) && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('ems_doctypes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          effectiveDocTypes = parsed;
        }
      }
    } catch (e) {}
  }
  if (!effectiveDocTypes || effectiveDocTypes.length === 0) {
    effectiveDocTypes = INITIAL_DOCUMENT_TYPES;
  }
  const requiredDocTypes = (effectiveDocTypes || []).filter(dt => Boolean(dt.isRequired));

  if (!emp) {
    const defaultMissing = [
      'Personal Details',
      'Legal Work Rights',
      'Emergency Contact',
      'Banking & TFN',
    ];
    if (requiredDocTypes.length > 0) defaultMissing.push('Compulsory Documents');

    return {
      completedCount: 0,
      totalSections: requiredDocTypes.length > 0 ? 5 : 4,
      percent: 0,
      isComplete: false,
      sections: [],
      missingSectionTitles: defaultMissing,
      missingDocuments: requiredDocTypes.map(d => d.name),
      requiredDocumentTypes: requiredDocTypes,
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
  const citizenStr = String(emp.citizenStatus || '').trim().toUpperCase();
  if (!emp.citizenStatus || citizenStr === '' || citizenStr === 'UNDEFINED') {
    missingWorkRights.push('Citizenship / Visa Status');
  } else if (citizenStr.includes('VISA') || citizenStr.includes('TEMPORARY') || emp.citizenStatus === 'VISA_HOLDER') {
    if (!emp.visaType?.trim()) missingWorkRights.push('Visa Subclass');
    if (!emp.visaExpiryDate?.trim()) missingWorkRights.push('Visa Expiry Date');
  }
  if (!emp.visaStatusConfirmed) {
    missingWorkRights.push('Work Rights Declaration Confirmation');
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
  if (!emp.accountName?.trim()) missingBanking.push('Account Name');
  const bsb = (emp.bsb || emp.bsbMasked || emp.bsbEncrypted || '').trim();
  if (!bsb || bsb === '•••-•••') missingBanking.push('BSB Number');
  const acc = (emp.accountNumber || emp.accountNumberMasked || emp.accountNumberEncrypted || '').trim();
  if (!acc || acc === '••••••••') missingBanking.push('Account Number');
  const isBankingDone = missingBanking.length === 0;

  // 5. Compulsory Compliance Documents
  const missingDocuments: string[] = [];
  if (requiredDocTypes.length > 0) {
    const uploadedDocs = emp.documents || [];
    for (const dt of requiredDocTypes) {
      const hasUploaded = uploadedDocs.some(
        d => (d.type === dt.name || (d.name && d.name.toLowerCase().includes(dt.name.toLowerCase()))) && d.status !== 'Rejected'
      );
      if (!hasUploaded) {
        missingDocuments.push(dt.name);
      }
    }
  }
  const isDocumentsDone = requiredDocTypes.length === 0 || missingDocuments.length === 0;

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

  if (requiredDocTypes.length > 0) {
    sections.push({
      id: 'DOCUMENTS',
      title: 'Compulsory Documents',
      description: 'Upload all mandatory compliance files',
      isDone: isDocumentsDone,
      missingFields: missingDocuments,
    });
  }

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
    missingDocuments,
    requiredDocumentTypes: requiredDocTypes,
  };
}
