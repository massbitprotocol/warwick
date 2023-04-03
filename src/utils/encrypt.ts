const AES = require("crypto-js/aes");
import { v4 as uuidv4 } from 'uuid';

export const encryptBody = (body: string, secretKey: string): string => {
  // return AES.encrypt(body, secretKey).toString()
  return body
}

export const newContextId = () => uuidv4()