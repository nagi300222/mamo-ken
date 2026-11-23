import {NORMAL_CONTACTS as BASE_CONTACTS,NORMAL_HURT_BOUNDS as BASE_HURT,NORMAL_CONTACTS_VERSION as BASE_VERSION} from './normal-contacts-v151.js';
import {APPROVED_P3_CONTACT_DELIVERY} from './normal-contact-overrides-p3.js';
import {validateP3ContactDelivery} from './p3-contact-adapter.js';
const approved=APPROVED_P3_CONTACT_DELIVERY?validateP3ContactDelivery(APPROVED_P3_CONTACT_DELIVERY):null;
export const NORMAL_CONTACTS=approved?.characters??BASE_CONTACTS;
export const NORMAL_HURT_BOUNDS=approved?.hurtBounds??BASE_HURT;
export const NORMAL_CONTACTS_VERSION=approved?.version??BASE_VERSION;
export const ACTIVE_NORMAL_MOTION_VERSION=approved?'v17':'v15';
