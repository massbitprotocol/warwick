const AES = require("crypto-js/aes");

export const encryptBody = (body: string, secretKey: string): string => {
  // return AES.encrypt(body, secretKey).toString()
  return body
}