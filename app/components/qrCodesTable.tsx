import { useNavigation, useSubmit } from '@remix-run/react';
import { Modal, TitleBar } from '@shopify/app-bridge-react';
import {
  Box,
  Icon,
  IndexTable,
  InlineStack,
  Link,
  Text,
  Thumbnail,
  useBreakpoints,
  useIndexResourceState,
} from '@shopify/polaris';
import { AlertDiamondIcon, ImageIcon } from '@shopify/polaris-icons';
import { useEffect } from 'react';

export default function QRCodesTable(qrCodes: any[]) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isDeleting = navigation.state === 'submitting';

  const resourceName = {
    singular: 'QR Code',
    plural: 'QR Codes',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(qrCodes);

  function truncate(str: string, { length = 25 } = {}) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.slice(0, length) + '…';
  }

  function handleBulkDelete() {
    const ids = selectedResources;
    shopify.modal.hide('bulk-delete-modal');
    clearSelection();
    submit({ ids }, { action: '.', method: 'post' });
  }

  const promotedBulkActions = [
    {
      destructive: true,
      content: 'Delete QR Codes',
      onAction: () => shopify.modal.show('bulk-delete-modal'),
    },
  ];

  useEffect(() => {
    if (isDeleting) {
      shopify.toast.show('Deleting...');
    } else {
      shopify.toast.hide('Deleting...');
    }
  }, [isDeleting]);

  return (
    <>
      <IndexTable
        condensed={useBreakpoints().smDown}
        resourceName={resourceName}
        itemCount={qrCodes.length}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        hasMoreItems
        promotedBulkActions={promotedBulkActions}
        headings={[
          { title: 'Thumbnail', hidden: true },
          { title: 'Title' },
          { title: 'Product' },
          { title: 'Scans' },
          { title: 'Date created' },
          { title: 'Date updated' },
        ]}
      >
        {qrCodes.map((qrCode, idx) => {
          return (
            <IndexTable.Row
              key={qrCode.id}
              id={qrCode.id}
              position={idx}
              selected={selectedResources.includes(qrCode.id)}
            >
              <IndexTable.Cell>
                <Thumbnail source={qrCode.productImage || ImageIcon} alt={qrCode.productTitle} size="small" />
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Link dataPrimaryLink url={`/app/qrcodes/${qrCode.id}`}>
                  <Text fontWeight="bold" as="span" truncate>
                    {truncate(qrCode.title)}
                  </Text>
                </Link>
              </IndexTable.Cell>
              <IndexTable.Cell>
                {qrCode.productDeleted ? (
                  <InlineStack align="start" gap="200">
                    <span style={{ width: '20px' }}>
                      <Icon source={AlertDiamondIcon} tone="critical" />
                    </span>
                    <Text tone="critical" as="span">
                      product has been deleted
                    </Text>
                  </InlineStack>
                ) : (
                  truncate(qrCode.productTitle)
                )}
              </IndexTable.Cell>
              <IndexTable.Cell>{qrCode.scans}</IndexTable.Cell>
              <IndexTable.Cell>{new Date(qrCode.createdAt).toDateString()}</IndexTable.Cell>
              <IndexTable.Cell>{new Date(qrCode.updatedAt).toDateString()}</IndexTable.Cell>
            </IndexTable.Row>
          );
        })}
      </IndexTable>

      <Modal id="bulk-delete-modal">
        <Box padding="400">
          <Text variant="bodyMd" as="p">
            Are you sure you want to delete all select QR Codes?
          </Text>
        </Box>
        <TitleBar title={`Delete ${selectedResources.length} QR Codes?`}>
          <button variant="primary" tone="critical" onClick={handleBulkDelete}>
            Delete
          </button>
          <button onClick={() => shopify.modal.hide('bulk-delete-modal')}>Cancel</button>
        </TitleBar>
      </Modal>
    </>
  );
}
