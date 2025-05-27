import { ESlotsGetting } from 'src/HighLevel/Enums';
import { PKCS11 } from '../src';

const pkcs11 = new PKCS11('./test/bin/rtpkcs11ecp.dll');

pkcs11.startListenSlots();
setTimeout(() => {
	const slots = pkcs11.getSlotsInfo(ESlotsGetting.CachedOnly);
	pkcs11.stopListenSlots();

	const slot = pkcs11.slotFactory(slots.keys().next().value);
	const session = slot.openSession({ rw: true, serial: true });
	console.log(session);
}, 1000);
