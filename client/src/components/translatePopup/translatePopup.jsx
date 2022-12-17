import { Form, Modal, Input } from "antd";

export const TranslatePopup = ({ open, onCreate, onCancel, json }) => {
  const [form] = Form.useForm();

  return (
    <Modal
      open={open}
      title={`TRANSLATE a new card in ${json}`}
      okText="Create"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            onCreate(values);
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{
          modifier: 'public',
        }}
      >
        <Form.Item
          name="cardNumber"
          label="card Number"
          // disabled = {true}
        >
          <Input  />
        </Form.Item>
        <Form.Item name="field1" label={<>field1 : <strong> text from translated field</strong></>}>
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field2" label="Field2">
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field3" label="Field3">
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field4" label="Field4">
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field5" label="Field5">
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field6" label="Field6">
          <Input type="textarea" />
        </Form.Item>

        <Form.Item name="category" label="Category">
          <Input type="textarea" />
        </Form.Item>
      </Form>
    </Modal>
  );
};