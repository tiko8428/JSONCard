import { Form, Modal, Input } from "antd";

export const EditPopup = ({ open, onEdit, onCancel, json, record }) => {
  const [form] = Form.useForm();

  return (
    <Modal
      open={open}
      title={`EDIT a new card in ${json}`}
      okText="Edit"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            // form.resetFields();
            onEdit(values);
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
          ...record
        }}
      >
        <Form.Item name="cardNumber" label="card Number">
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field1" label="Field1">
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