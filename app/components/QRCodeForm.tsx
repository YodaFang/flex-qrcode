import { Form } from '@remix-run/react';
import { Button, Card, FormLayout, Select, TextField } from '@shopify/polaris';

export default function QRCodeForm() {
  <Form data-save-bar method="post">
    <FormLayout>
      <Card>
        <TextField
          id="title"
          label="Title"
          type="text"
          autoComplete="off"
          value={formState.title}
          onChange={(title) => setFormState({ ...formState, title })}
          error={errors.title}
          helpText="Only store staff can see this title"
        />
        <Select
          label="Profile"
          name="profileId"
          options={options}
          onChange={(value) => setFormState({ ...formState, profileId: value })}
          value={formState.profileId}
        />
      </Card>
      <Card>
        <TextField
          id="title"
          label="Title"
          type="text"
          autoComplete="off"
          value={formState.title}
          onChange={(title) => setFormState({ ...formState, title })}
          error={errors.title}
          helpText="Only store staff can see this title"
        />
        <Select
          label="Profile"
          name="profileId"
          options={options}
          onChange={(value) => setFormState({ ...formState, profileId: value })}
          value={formState.profileId}
        />
      </Card>
    </FormLayout>
    <Button submit>Submit</Button>
  </Form>;
}
