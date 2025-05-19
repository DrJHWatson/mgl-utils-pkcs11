import { PKCS11Lib } from '../src/PKCS11Lib';

const a = new PKCS11Lib('./test/bin/rtpkcs11ecp.dll');

a.C_Initialize();
console.log(a.C_GetInfo());

console.log(a.C_GetSlotList().map((id) => a.C_GetSlotInfo(id)));
