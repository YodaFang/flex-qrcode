import qrcode from "qrcode";
import invariant from "tiny-invariant";
import db from "../db.server";
import type { QRCode as  QRCodeModel } from "@prisma/client";

export interface ExtendedQRCode extends QRCodeModel {
  productTitle: string | '';
  productImage: string | '';
  productAlt: string | '';
  productDeleted: boolean;
  destinationUrl: string;
  image: string;
}


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
      query getProductById($id: ID!) {
      product(id: $id) {
        id
        title
        media(first: 1) {
          edges {
            node {
              ... on MediaImage {
                image {
                  url
                  altText
                }
              }
              ... on Video {
                sources {
                  url
                }
              }
            }
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

  const { data: { product } } = response;
  return {
    ...qrCode,
    productDeleted: !product?.title,
    productTitle: product?.title,
    productImage: product?.media?.edges[0]?.node?.image?.url ?? null,
    productAlt: product?.media?.edges[0]?.node?.image?.altText ?? null,
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
