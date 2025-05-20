import { PKCS11Lib } from '../src/PKCS11Lib';

const a = new PKCS11Lib('./test/bin/rtpkcs11ecp.dll');

a.C_Initialize();
// console.log(a.C_GetInfo());

// console.log(
// 	a.C_GetSlotList().map((id) => {
// 		return {
// 			slot: a.C_GetSlotInfo(id),
// 			token: a.C_GetTokenInfo(id),
// 		};
// 	}),
// );
// console.log(a.C_GetTokenInfo(2));
const newPromise = () =>
	new Promise((resolve) => {
		console.log(a.C_WaitForSlotEvent());
		setTimeout(() => resolve(newPromise()), 1000);
	});

newPromise();
