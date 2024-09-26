import { useNavigation, useSubmit } from '@remix-run/react';
import { Modal, TitleBar } from '@shopify/app-bridge-react';
import { Box, IndexTable, Link, Text, useBreakpoints, useIndexResourceState } from '@shopify/polaris';
import { useEffect } from 'react';

export default function ProfilesTable(profiles: any[]) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isDeleting = navigation.state === 'submitting';

  const resourceName = {
    singular: 'Profile',
    plural: 'Profiles',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } = useIndexResourceState(profiles);

  const truncate = (str: string, { length = 25 } = {}): string =>
    !str ? '' : str.length <= length ? str : `${str.slice(0, length)}…`;

  function handleBulkDelete() {
    const ids = selectedResources;
    shopify.modal.hide('bulk-delete-modal');
    clearSelection();
    submit({ ids }, { action: '.', method: 'post' });
  }

  const promotedBulkActions = [
    {
      destructive: true,
      content: 'Delete Profiles',
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
        itemCount={profiles.length}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        promotedBulkActions={promotedBulkActions}
        headings={[{ title: 'Name' }, { title: 'Date created' }, { title: 'Last updated' }]}
      >
        {profiles.map((profile, idx) => {
          return (
            <IndexTable.Row
              key={profile.id}
              id={profile.id}
              position={idx}
              selected={selectedResources.includes(profile.id)}
            >
              <IndexTable.Cell>
                <Link dataPrimaryLink url={`/app/profiles/${profile.id}`}>
                  <Text fontWeight="bold" as="span">
                    {truncate(profile.name)}
                  </Text>
                </Link>
              </IndexTable.Cell>
              <IndexTable.Cell>{new Date(profile.createdAt).toDateString()}</IndexTable.Cell>
              <IndexTable.Cell>{new Date(profile.updatedAt).toDateString()}</IndexTable.Cell>
            </IndexTable.Row>
          );
        })}
      </IndexTable>

      <Modal id="bulk-delete-modal">
        <Box padding="400">
          <Text variant="bodyMd" as="p">
            Are you sure you want to delete all selected Profiles?
          </Text>
        </Box>
        <TitleBar title={`Delete ${selectedResources.length} Profiles?`}>
          <button variant="primary" tone="critical" onClick={handleBulkDelete}>
            Delete
          </button>
          <button onClick={() => shopify.modal.hide('bulk-delete-modal')}>Cancel</button>
        </TitleBar>
      </Modal>
    </>
  );
}
