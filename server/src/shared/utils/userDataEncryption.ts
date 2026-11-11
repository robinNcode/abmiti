import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'crypto';
import { env } from '../../config/env';

const PREFIX = 'abmiti:v1:';
const SENSITIVE_FIELDS = new Set([
  'name',
  'avatar',
  'label',
  'accountNumber',
  'account_number',
  'bankName',
  'bank_name',
  'note',
  'notes',
  'rawSms',
  'raw_sms',
  'sector',
  'counterparty',
  'templateName',
  'template_name',
  'category_name',
  'cat_name',
  'acc_name',
  'acc_number',
  'acc_bank',
  'account_name',
  'categoryName',
  'accountName',
]);

const masterKey = (): Buffer => {
  const key = Buffer.from(env.DATA_ENCRYPTION_KEY, 'base64');
  if (key.length !== 32) {
    throw new Error('DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  }
  return key;
};

const userKey = (userId: string): Buffer =>
  Buffer.from(
    hkdfSync(
      'sha256',
      masterKey(),
      Buffer.from(userId, 'utf8'),
      Buffer.from('abmiti:user-data:v1', 'utf8'),
      32,
    ),
  );

export const encryptUserValue = (userId: string, value: string): string => {
  if (value.startsWith(PREFIX)) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', userKey(userId), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
};

export const decryptUserValue = (userId: string, value: string): string => {
  if (!value.startsWith(PREFIX)) return value;

  const parts = value.slice(PREFIX.length).split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted user data');

  const [encodedIv, encodedTag, encodedData] = parts;
  const decipher = createDecipheriv(
    'aes-256-gcm',
    userKey(userId),
    Buffer.from(encodedIv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedData, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

export const userDataLookupHash = (userId: string, value: string): string => {
  const plaintext = decryptUserValue(userId, value);
  return createHmac('sha256', userKey(userId))
    .update(plaintext.trim().toLowerCase())
    .digest('hex');
};

export const transformUserData = <T>(userId: string, value: T, encrypt: boolean): T => {
  const visit = (item: unknown, key?: string): unknown => {
    if (typeof item === 'string' && key && SENSITIVE_FIELDS.has(key)) {
      return encrypt ? encryptUserValue(userId, item) : decryptUserValue(userId, item);
    }
    if (Array.isArray(item)) return item.map((entry) => visit(entry));
    if (
      item &&
      typeof item === 'object' &&
      !(item instanceof Date) &&
      !Buffer.isBuffer(item) &&
      (item as { _bsontype?: string })._bsontype !== 'ObjectId'
    ) {
      return Object.fromEntries(
        Object.entries(item).map(([childKey, child]) => [childKey, visit(child, childKey)]),
      );
    }
    return item;
  };

  return visit(value) as T;
};
