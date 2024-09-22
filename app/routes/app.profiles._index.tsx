import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { Card, EmptyState, Layout, Page } from '@shopify/polaris';
import ProfilesTable from '~/components/profilesTable';

import { getProfiles } from '~/models/Profile.server';
import { authenticate } from '~/shopify.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const profiles = await getProfiles(shop);
  return json({ profiles });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const ids = (await request.formData()).get('ids').split(',');

  await prisma.profile.deleteMany({
    where: {
      id: {
        in: ids,
      },
      shop,
    },
  });
  return redirect('.');
};

export default function Index() {
  const { profiles } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <>
      <Page
        title="All Profiles"
        primaryAction={{ content: 'Create Profile', onAction: () => navigate('/app/profiles/new') }}
      >
        <Layout>
          <Layout.Section>
            <Card padding="0">
              {profiles.length === 0 ? (
                <EmptyState
                  heading="Create Profile"
                  action={{
                    content: 'Create Profile',
                    onAction: () => navigate('/app/profiles/new'),
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Allow customers to scan codes and buy products using their phones.</p>
                </EmptyState>
              ) : (
                <ProfilesTable profiles={profiles}></ProfilesTable>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}
