import type { CreateCheckFn, CustomRegex } from '../types';
export declare enum PIIEntity {
    CREDIT_CARD = "CREDIT_CARD",
    CRYPTO = "CRYPTO",
    DATE_TIME = "DATE_TIME",
    EMAIL_ADDRESS = "EMAIL_ADDRESS",
    IBAN_CODE = "IBAN_CODE",
    IP_ADDRESS = "IP_ADDRESS",
    LOCATION = "LOCATION",
    PHONE_NUMBER = "PHONE_NUMBER",
    MEDICAL_LICENSE = "MEDICAL_LICENSE",
    US_BANK_NUMBER = "US_BANK_NUMBER",
    US_DRIVER_LICENSE = "US_DRIVER_LICENSE",
    US_ITIN = "US_ITIN",
    US_PASSPORT = "US_PASSPORT",
    US_SSN = "US_SSN",
    UK_NHS = "UK_NHS",
    UK_NINO = "UK_NINO",
    ES_NIF = "ES_NIF",
    ES_NIE = "ES_NIE",
    IT_FISCAL_CODE = "IT_FISCAL_CODE",
    IT_DRIVER_LICENSE = "IT_DRIVER_LICENSE",
    IT_VAT_CODE = "IT_VAT_CODE",
    IT_PASSPORT = "IT_PASSPORT",
    IT_IDENTITY_CARD = "IT_IDENTITY_CARD",
    PL_PESEL = "PL_PESEL",
    SG_NRIC_FIN = "SG_NRIC_FIN",
    SG_UEN = "SG_UEN",
    AU_ABN = "AU_ABN",
    AU_ACN = "AU_ACN",
    AU_TFN = "AU_TFN",
    AU_MEDICARE = "AU_MEDICARE",
    IN_PAN = "IN_PAN",
    IN_AADHAAR = "IN_AADHAAR",
    IN_VEHICLE_REGISTRATION = "IN_VEHICLE_REGISTRATION",
    IN_VOTER = "IN_VOTER",
    IN_PASSPORT = "IN_PASSPORT",
    FI_PERSONAL_IDENTITY_CODE = "FI_PERSONAL_IDENTITY_CODE"
}
export type PIIConfig = {
    entities?: PIIEntity[];
    customRegex?: CustomRegex[];
};
export type CustomRegexConfig = {
    customRegex: CustomRegex[];
};
export declare const PII_NAME_MAP: Record<PIIEntity, string>;
export declare const createPiiCheckFn: CreateCheckFn<PIIConfig>;
export declare const createCustomRegexCheckFn: CreateCheckFn<CustomRegexConfig>;
