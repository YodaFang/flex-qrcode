import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { useLoaderData } from "@remix-run/react";

import { findQRCode, getQRCodeImage } from "../models/QRCode.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.id, "QR code ID missed!");

  const id = Number(params.id);
  const qrCode = await findQRCode({ id });

  invariant(qrCode, "Could not find QR code destination");

  return json({
    title: qrCode.title,
    image: await getQRCodeImage(id),
  });
};

export default function QRCode() {
  const { image, title } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>{title}</h1>
      <img src={image} alt={`QR Code for product`} />
    </>
  );
}
