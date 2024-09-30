import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from '@remix-run/react';
import { SaveBar } from '@shopify/app-bridge-react';
import {
  Bleed,
  BlockStack,
  Button,
  Card,
  ChoiceList,
  Divider,
  InlineError,
  InlineStack,
  Layout,
  Page,
  PageActions,
  Select,
  Text,
  TextField,
  Thumbnail,
} from '@shopify/polaris';
import { ImageIcon } from '@shopify/polaris-icons';
import { useEffect, useState } from 'react';
import { authenticate } from '../shopify.server';
import type { ExtendedQRCode } from "~/models/QRCode.server";
import { getProfiles } from '~/models/Profile.server';
import { newModel as newQRCodeModel, validateQRCode } from "~/models/QRCode.server";
import db from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const profiles = await getProfiles(shop);

  return {
      ... newQRCodeModel(),
      productDeleted: '',
      productTitle: '',
      productImage: '',
      productAlt: '',
      destinationUrl: '',
      image: ''
    };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const title = formData.get('title')?.toString();

  const data = {
    ...Object.fromEntries(formData),
    shop,
  } as ExtendedQRCode;

  const errors = validateQRCode(data);

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const qrCode = await db.qRCode.create({ data });

  if (!qrCode) throw new Error('Error occurs when create QR Code!');
  return redirect(`/app/qrcodes/${qrCode.id}`);
}

export default function NewQRCode() {
  const qrCode = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors || {};
  const submit = useSubmit();

  const navigate = useNavigate();
  const [formState, setFormState] = useState(qrCode);
  const [cleanFormState, setCleanFormState] = useState(qrCode);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const navigation = useNavigation();
  const isSaving = navigation.state === 'submitting';

  async function selectProduct() {
    const products = await window.shopify.resourcePicker({
      type: 'product',
      action: 'select', // customized action verb, either 'select' or 'add',
    });

    if (products) {
      const { images, id, variants, title, handle } = products[0];

      setFormState({
        ...formState,
        productId: id,
        productVariantId: variants[0].id,
        productTitle: title,
        productHandle: handle,
        productAlt: images[0]?.altText,
        productImage: images[0]?.originalSrc,
      });
    }
  }

  function handleSave() {
    const data = {
      title: formState.title,
      productId: formState.productId || '',
      productVariantId: formState.productVariantId || '',
      productHandle: formState.productHandle || '',
      destination: formState.destination,
    };
    setCleanFormState({ ...formState });
    submit(data, { method: 'post' });
  }

  function handleDiscard() {
    setFormState({ ...cleanFormState });
  }

  useEffect(() => {
    if (isDirty) {
      shopify.saveBar.show('qrcode-save-bar');
    } else {
      shopify.saveBar.hide('qrcode-save-bar');
    }
  }, [isDirty]);

  useEffect(() => {
    if (isSaving) {
      shopify.toast.show('Saving...');
    } else {
      shopify.toast.hide('Saving...');
    }
  }, [isSaving]);

  return (
    <>
      <Page
        backAction={{
          content: 'Ninja Codes',
          onAction: async () => {
            await shopify.saveBar.leaveConfirmation();
            navigate(-1);
          },
        }}
        title="Create QR Code"
      >
        <Layout>
          <Layout.Section>
            <BlockStack gap="500">
              <Card padding={{ xs: '400', sm: '600' }}>
                <BlockStack gap="400">
                  <Text as={'h3'} variant="headingMd">
                    Title
                  </Text>
                  <TextField
                    id="title"
                    helpText="Only store staff can see this title"
                    label="title"
                    labelHidden
                    autoComplete="off"
                    value={formState.title}
                    onChange={(title) => setFormState({ ...formState, title })}
                    error={errors.title}
                  />
                </BlockStack>
              </Card>
              <Card padding={{ xs: '400', sm: '600' }}>
                <BlockStack gap="500">
                  <InlineStack align="space-between">
                    <Text as={'h3'} variant="headingMd">
                      Product
                    </Text>
                    {formState.productId ? (
                      <Button variant="plain" onClick={selectProduct}>
                        Change product
                      </Button>
                    ) : null}
                  </InlineStack>
                  {formState.productId ? (
                    <InlineStack blockAlign="center" gap="500">
                      <Thumbnail source={formState.productImage || ImageIcon} alt={formState.productAlt} />
                      <Text as="span" variant="headingMd" fontWeight="semibold">
                        {formState.productTitle}
                      </Text>
                    </InlineStack>
                  ) : (
                    <InlineStack gap="200">
                      <Button onClick={selectProduct} id="select-product">
                        Select product
                      </Button>
                      {errors.productId ? <InlineError message={errors.productId} fieldID="myFieldID" /> : null}
                    </InlineStack>
                  )}
                  <Bleed marginInlineStart="200" marginInlineEnd="200">
                    <Divider borderWidth="050" />
                  </Bleed>
                  <BlockStack gap="200" align="space-between">
                    <Text as={'h3'} variant="headingMd">
                      Scan Destination
                    </Text>
                    <ChoiceList
                      title="Scan destination"
                      titleHidden
                      choices={[
                        { label: 'Link to product page', value: 'product' },
                        {
                          label: 'Link to checkout page with product in the cart',
                          value: 'cart',
                        },
                      ]}
                      selected={[formState.destination]}
                      onChange={(destination) =>
                        setFormState({
                          ...formState,
                          destination: destination[0],
                        })
                      }
                      error={errors.destination}
                    />
                    {qrCode.destinationUrl ? (
                      <Button variant="plain" url={qrCode.destinationUrl} target="_blank">
                        Go to destination URL
                      </Button>
                    ) : null}
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section>
            <PageActions
              primaryAction={{
                content: 'Save',
                loading: isSaving,
                disabled: !isDirty || isSaving,
                onAction: handleSave,
              }}
            />
          </Layout.Section>
        </Layout>
      </Page>

      <SaveBar id="qrcode-save-bar">
        <button variant="primary" onClick={handleSave} loading={isSaving} disabled={!isDirty || isSaving}></button>
        <button onClick={handleDiscard} disabled={!isDirty || isSaving}></button>
      </SaveBar>
    </>
  );
}
