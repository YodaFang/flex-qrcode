
import qrcode from "qrcode";
import invariant from "tiny-invariant";
import db from "../db.server";
import type { QRCode as  QRCodeModel } from "@prisma/client";
export type { QRCode as  QRCodeModel } from "@prisma/client";

export async function getQRCode({ id, graphql } : Pick<QRCodeModel, "id"> & {graphql: any}) {
  const qrCode = await db.qRCode.findFirst({ where: { id } });
  if (!qrCode) return null;
  return supplementQRCode({qrCode, graphql});
}

export async function findQRCode({ id } : Pick<QRCodeModel, "id"> ) {
  return await db.qRCode.findFirst({ where: { id } });
}

export function newQRCodeModel(): Omit<QRCodeModel, 'id' | 'createdAt' | 'updatedAt'>  {
  return {
      title: '',
      shop: '',
      productId: '',
      productHandle: '',
      productVariantId: '',
      destination: '',
      scans: 0,
    };
}

export async function getQRCodes(shop: string, graphql: any) {
  const qrCodes = await db.qRCode.findMany({
    where: { shop },
    orderBy: { id: "desc" },
  });

  if (qrCodes.length === 0) return [];

  return Promise.all(
    qrCodes.map((qrCode) => supplementQRCode({qrCode, graphql}))
  );
}

export function getQRCodeImage(id: number) {
  const url = new URL(`/qrcodes/${id}/scan`, process.env.SHOPIFY_APP_URL);
  return qrcode.toDataURL(url.href);
}

export function getDestinationUrl(qrCode: QRCodeModel) {
  if (qrCode.destination === "product") {
    return `https://${qrCode.shop}/products/${qrCode.productHandle}`;
  }

  const match = /gid:\/\/shopify\/ProductVariant\/([0-9]+)/.exec(qrCode.productVariantId);
  invariant(match, "Unrecognized product variant ID");

  return `https://${qrCode.shop}/cart/${match[1]}:1`;
}

async function supplementQRCode({qrCode, graphql} : { qrCode: QRCodeModel,  graphql: any} ) {
  const qrCodeImagePromise = getQRCodeImage(qrCode.id);

  const response = await graphql(
    `
      query supplementQRCode($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: qrCode.productId,
      },
    }
  );

  const {
    data: { product },
  } = await response.json();

  return {
    ...qrCode,
    productDeleted: !product?.title,
    productTitle: product?.title,
    productImage: product?.images?.nodes[0]?.url,
    productAlt: product?.images?.nodes[0]?.altText,
    destinationUrl: getDestinationUrl(qrCode),
    image: await qrCodeImagePromise,
  };
}

export function validateQRCode(data: QRCodeModel) {
  const errors = {};

  if (Object.keys(errors).length) {
    return errors;
  }
}
