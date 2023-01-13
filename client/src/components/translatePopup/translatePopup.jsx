import { useEffect } from "react";
import { Form, Modal, Input } from "antd";
import { commonApi } from "../../api/common";

export const TranslatePopup = ({ open, onTranslate, onCancel, json, originData, targetLanguage }) => {
  const [form] = Form.useForm();
  const [originLaval, originLanguage] = json.split("/");
  const { cardNumber } = originData;

  const labelRender = (name) => {
    return <>{name}:<span style={{ color: "red", paddingLeft: 15 }}> {originData[name]}</span></>
  }

  useEffect(() => {
    if (targetLanguage) {
      commonApi.getByCardNumber({ language: targetLanguage, laval: originLaval, cardNumber }).then(res => {
        const targetData = JSON.parse(res.data);
        form.setFieldsValue({
          field1: targetData["field1"],
          field2: targetData["field2"],
          field3: targetData["field3"],
          field4: targetData["field4"],
          field5: targetData["field5"],
          field6: targetData["field6"],
          field6: targetData["field7"],
          field6: targetData["field8"],
          category: targetData["category"]
        }
        )

      }).catch(err => {
      })
    }
  }, [])

  if (!originData) return null;

  return (
    <Modal
      open={open}
      title={<p>Translate from {originLanguage.toUpperCase()} to {targetLanguage.toUpperCase()} <br/> Card Number : <strong>{cardNumber}</strong> </p>}
      okText="Translate"
      cancelText="Cancel"
      onCancel={() => { form.resetFields(); onCancel() }}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            // form.resetFields();
            onTranslate({ values: { cardNumber, ...values }, laval: originLaval, language: targetLanguage });
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
      >
        <Form.Item name="field1"
          label={labelRender("field1")}
        >
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field2" label={labelRender("field2")}>
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field3" label={labelRender("field3")}>
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field4" label={labelRender("field4")}>
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field5" label={labelRender("field5")}>
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field6" label={labelRender("field6")}>
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field7" label={labelRender("field7")}>
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="field8" label={labelRender("field8")}>
          <Input type="textarea" />
        </Form.Item>
        <Form.Item name="category" label={labelRender("category")}>
          <Input type="textarea" />
        </Form.Item>
      </Form>
    </Modal>
  );
};