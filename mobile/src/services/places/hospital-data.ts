import { Hospital } from './types';

export const CACHED_HOSPITALS: Omit<Hospital, 'distanceKm' | 'estimatedEtaMin'>[] = [
  { id: 'h-isl-1', name: 'Pakistan Institute of Medical Sciences (PIMS)', latitude: 33.6519, longitude: 73.0569, phone: '+92-51-9100140', address: 'Sector H-8/3, Islamabad', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-isl-2', name: 'Shifa International Hospital', latitude: 33.6601, longitude: 73.0856, phone: '+92-51-8463222', address: 'Sector H-8/4, Islamabad', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-isl-3', name: 'Federal Government Services Hospital (Poly Clinic)', latitude: 33.7157, longitude: 73.0744, phone: '+92-51-9211303', address: 'G-6 Markaz, Islamabad', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-isl-4', name: 'Quaid-e-Azam International Hospital', latitude: 33.5681, longitude: 73.0822, phone: '+92-51-111-111-846', address: 'Bahria Town Phase 8, Islamabad', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-isl-5', name: 'Northeast International Hospital', latitude: 33.6428, longitude: 73.0456, phone: '+92-51-111-729-729', address: 'G-10 Markaz, Islamabad', hasEmergencyDept: true, source: 'cached' },

  { id: 'h-khi-1', name: 'Aga Khan University Hospital', latitude: 24.8689, longitude: 67.0644, phone: '+92-21-34861147', address: 'Stadium Road, Karachi', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-khi-2', name: 'Jinnah Postgraduate Medical Centre (JPMC)', latitude: 24.8493, longitude: 67.0694, phone: '+92-21-99201100', address: 'Rafiqui Shaheed Road, Karachi', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-khi-3', name: 'Civil Hospital Karachi', latitude: 24.8547, longitude: 67.0011, phone: '+92-21-99215740', address: 'M.A. Jinnah Road, Karachi', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-khi-4', name: 'Liaquat National Hospital', latitude: 24.8722, longitude: 67.0525, phone: '+92-21-34412617', address: 'National Stadium Road, Karachi', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-khi-5', name: 'South City Hospital', latitude: 24.8206, longitude: 67.0639, phone: '+92-21-111-000-742', address: 'Shahrah-e-Faisal, Karachi', hasEmergencyDept: true, source: 'cached' },

  { id: 'h-lhr-1', name: 'Services Hospital Lahore', latitude: 31.5520, longitude: 74.3362, phone: '+92-42-99203044', address: 'Lower Mall, Lahore', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-lhr-2', name: 'Jinnah Hospital Lahore', latitude: 31.4805, longitude: 74.2889, phone: '+92-42-99231412', address: 'Allama Iqbal Medical College, Lahore', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-lhr-3', name: 'Shaukat Khanum Memorial Cancer Hospital', latitude: 31.4717, longitude: 74.2733, phone: '+92-42-35945100', address: '7A Block R-3, Johar Town, Lahore', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-lhr-4', name: 'Mayo Hospital Lahore', latitude: 31.5657, longitude: 74.3172, phone: '+92-42-99210351', address: 'Lower Mall Road, Lahore', hasEmergencyDept: true, source: 'cached' },

  { id: 'h-psw-1', name: 'Lady Reading Hospital', latitude: 34.0145, longitude: 71.6708, phone: '+92-91-9211161', address: 'Sadar Road, Peshawar', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-psw-2', name: 'Hayatabad Medical Complex', latitude: 33.9933, longitude: 71.4922, phone: '+92-91-5860022', address: 'Hayatabad, Peshawar', hasEmergencyDept: true, source: 'cached' },

  { id: 'h-quetta-1', name: 'Civil Hospital Quetta', latitude: 30.1992, longitude: 67.0006, phone: '+92-81-9201336', address: 'Prince Road, Quetta', hasEmergencyDept: true, source: 'cached' },
  { id: 'h-quetta-2', name: 'Bolan Medical Complex Hospital', latitude: 30.2125, longitude: 67.0156, phone: '+92-81-9201422', address: 'Airport Road, Quetta', hasEmergencyDept: true, source: 'cached' },
];

export const CACHED_WORKSHOPS: Omit<Hospital, 'distanceKm' | 'estimatedEtaMin' | 'hasEmergencyDept'>[] = [
  { id: 'w-isl-1', name: 'Islamabad Auto Workshop', latitude: 33.6844, longitude: 73.0479, phone: '+92-300-1234567', address: 'Blue Area, Islamabad', source: 'cached' },
  { id: 'w-isl-2', name: 'F-7 Car Service Center', latitude: 33.7214, longitude: 73.0571, phone: '+92-321-7654321', address: 'F-7 Markaz, Islamabad', source: 'cached' },
  { id: 'w-khi-1', name: 'Karachi Motors Workshop', latitude: 24.8607, longitude: 67.0011, phone: '+92-300-9876543', address: 'Shahrah-e-Faisal, Karachi', source: 'cached' },
  { id: 'w-lhr-1', name: 'Lahore Auto Repair', latitude: 31.5204, longitude: 74.3587, phone: '+92-300-1112223', address: 'Liberty Market, Lahore', source: 'cached' },
];