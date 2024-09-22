import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import type { FunctionComponent } from "react";
import { authenticate } from "../shopify.server";
import {
  Card,
  EmptyState,
  Layout,
  Page,
  IndexTable,
  Thumbnail,
  Text,
  Icon,
  InlineStack,
} from "@shopify/polaris";

import { getQRCodes } from "~/models/QRCode.server";
import { AlertDiamondIcon, ImageIcon } from "@shopify/polaris-icons";
import type { ExtendedQRCode } from "~/models/QRCode.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const qrCodes = await getQRCodes(session.shop, admin.graphql);
  return qrCodes;
};

const EmptyQRCodeState = ({ onAction }: { onAction: () => void }) => (
  <EmptyState
    heading="Create unique QR codes for your product"
    action={{
      content: "Create QR code",
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Allow customers to scan codes and buy products using their phones.</p>
  </EmptyState>
);

function truncate(str : string, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

const QRTable: FunctionComponent<{ qrCodes: ExtendedQRCode[] }> = ({ qrCodes }) => (
  <IndexTable
    resourceName={{
      singular: "QR code",
      plural: "QR codes",
    }}
    itemCount={qrCodes.length}
    headings={[
      { title: "Thumbnail" },
      { title: "Title" },
      { title: "Product" },
      { title: "Date created" },
      { title: "Scans" },
    ]}
    selectable={false}
  >
    {qrCodes.map((qrCode) => (
      <QRTableRow key={qrCode.id} qrCode={qrCode} />
    ))}
  </IndexTable>
);

const QRTableRow: FunctionComponent<{ qrCode: ExtendedQRCode }> = ({ qrCode }) => (
  <IndexTable.Row id={qrCode.id.toString()} position={qrCode.id}>
    <IndexTable.Cell>
      <Thumbnail
        source={qrCode.productImage || ImageIcon}
        alt={qrCode.productTitle || "No image"}
        size="small"
      />
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link to={`qrcodes/${qrCode.id}`}>{truncate(qrCode.title)}</Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {qrCode.productDeleted ? (
        <InlineStack align="start" gap="200">
          <span style={{ width: "20px" }}>
            <Icon source={AlertDiamondIcon} tone="critical" />
          </span>
          <Text tone="critical" as="span">
            Product has been deleted
          </Text>
        </InlineStack>
      ) : (
        truncate(qrCode.productTitle)
      )}
    </IndexTable.Cell>
    <IndexTable.Cell>
      { new Date(qrCode.createdAt).toLocaleDateString() } {/* 确保 createdAt 正确格式化 */}
    </IndexTable.Cell>
    <IndexTable.Cell>{qrCode.scans}</IndexTable.Cell>
  </IndexTable.Row>
);


export default function Index() {
  const qrCodes = useLoaderData<ExtendedQRCode[]>();
  const navigate = useNavigate();

  return (
    <Page>
      <ui-title-bar title="QR codes">
        <button variant="primary" onClick={() => navigate("/app/qrcodes/new")}>
          Create QR code
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {qrCodes.length === 0 ? (
              <EmptyQRCodeState onAction={() => navigate("qrcodes/new")} />
            ) : (
              <QRTable qrCodes={qrCodes} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
