import QRCode from "qrcode";

export async function generateQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, { margin: 1, width: 256 });
}

export function qrPayloadForStudent(academicNumber: string) {
  return `STU:${academicNumber}`;
}
