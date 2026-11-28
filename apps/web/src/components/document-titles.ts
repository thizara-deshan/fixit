import type { DocumentType } from '@fixit/contracts';

/** S26.E1 / S32.E1 slot titles. */
export const SLOT_TITLE: Record<DocumentType, string> = {
  nic_front: 'NIC — front',
  nic_back: 'NIC — back',
  trade_certificate: 'Trade certificate or NVQ',
  business_registration: 'Business registration',
};
export const DOCUMENT_ORDER: readonly DocumentType[] = [
  'nic_front',
  'nic_back',
  'trade_certificate',
  'business_registration',
];
