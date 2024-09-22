import qrcode from "qrcode";
import invariant from "tiny-invariant";
import db from "~/db.server";
import type { QRCode as  QRCodeModel } from "@prisma/client";
import type { Profile } from "@prisma/client";

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

  const response = await graphql(GET_PRODUCT_QUERY, {
    variables: { id: qrCode.productId, },
  });
  const { data: { product } } = await response.json();
  return extendQRCode(qrCode, product);
}

export async function findQRCode({ id } : Pick<QRCodeModel, "id"> ) {
  return await db.qRCode.findFirst({ where: { id }, include: { profile: true } });
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
      profileId: -1,
    };
}

export async function getQRCodes(shop: string, graphql: any) {
  const qrCodes = await db.qRCode.findMany({
    where: { shop },
    orderBy: { id: "desc" },
  });

  if (qrCodes.length === 0) return [];
  const productIds = qrCodes.map((qrCode) => qrCode.productId);
  const productResponse = await graphql(GET_PRODUCTS_QUERY, {
    variables: { ids: productIds },
  });
  const { data: { nodes: products } } = await productResponse.json();
  const productMap = new Map(products.map((product: any) => [product.id, product]));

  return qrCodes.map((qrCode) => {
    const product = productMap.get(qrCode.productId);
    return extendQRCode(qrCode, product);
  });
}

export function getQRCodeImage(id: number) {
  const url = new URL(`/qrcodes/${id}/scan`, process.env.SHOPIFY_APP_URL);
  return qrcode.toDataURL(url.href);
}

export function getDestinationUrl(qrCode: QRCodeModel & { profile?: Profile }) {
  if (qrCode.destination === "product") {
    return `https://${qrCode.shop}/products/${qrCode.productHandle}`;
  }

  const match = /gid:\/\/shopify\/ProductVariant\/([0-9]+)/.exec(qrCode.productVariantId);
  invariant(match, "Unrecognized product variant ID");

  let destinationUrl = `https://${qrCode.shop}/cart/${match[1]}:1`;
  if (qrCode.profile) destinationUrl += `?${utmParams(qrCode.profile)}`;

  return destinationUrl;
}

function extendQRCode(qrCode: QRCodeModel, product: any) {
  return {
    ...qrCode,
    productDeleted: !product?.title,
    productTitle: product?.title,
    productImage: product?.media?.edges[0]?.node?.image?.url ?? null,
    productAlt: product?.media?.edges[0]?.node?.image?.altText ?? null,
    destinationUrl: getDestinationUrl(qrCode),
    image: getQRCodeImage(qrCode.id),
  };
}

const GET_PRODUCT_QUERY = `
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
          }
        }
      }
    }
  }
`;

const GET_PRODUCTS_QUERY = `
  query getProductsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
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
            }
          }
        }
      }
    }
  }
`;

export function utmParams(profile: Profile) {
  if (!profile) return '';
  let utmParams = `utm_source=${profile.utmSource}&utm_medium=${profile.utmMedium}`;

  if (profile.utmCampaign) utmParams += `&utm_id=${profile.utmCampaign}`;
  if (profile.utmId) utmParams += `&utm_campaign=${profile.utmId}`;
  if (profile.utmId) utmParams += `&utm_id=${profile.utmId}`;
  if (profile.utmTerm) utmParams += `&utm_term=${profile.utmTerm}`;
  if (profile.utmContent) utmParams += `&utm_content=${profile.utmContent}`;

  return utmParams;
}

export function validateQRCode(data: QRCodeModel) {
  const errors = {};

  if (Object.keys(errors).length) {
    return errors;
  }
}
