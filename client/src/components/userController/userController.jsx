import { useEffect, useState } from 'react';
import { adminApi } from "../../api/admin";
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Col, Row, Table } from 'antd';


const laval = [
  { label: 'A1', value: 'A1' },
  { label: 'A2', value: 'A2' },
  { label: 'B1', value: 'B1' },
  { label: 'B2', value: 'B2' },
  { label: 'C1', value: 'C1' },
];

const language = [
  { label: 'de', value: 'de' },
  { label: 'ua', value: 'ua' },
  { label: 'ru', value: 'ru' },
  { label: 'en', value: 'en' },
];

export const UserController = () => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Rol',
      dataIndex: 'rol',
      key: 'rol',
    },
    {
      title: 'Action',
      dataIndex: '',
      key: 'x',
      render: (t) => {
        return <a
          onClick={() => {
            adminApi.deleteUser(t.key)
              .then((res) => {
                updateTable(res.data)
              })
          }}
        >Delete</a>
      }
    },
  ];
  const [form] = Form.useForm();
  const [usersLoading, setUsersLoading] = useState();
  const [users, setUsers] = useState([]);

  const updateTable = (data) => {
    const newUsers = data.map(item => {
      let newRol = ""
      item.rol.forEach(r => {
        newRol += r.laval + "/" + r.language + " , "
      })
      return {
        ...item,
        rol: newRol
      }
    });
    setUsers(newUsers);

  }

  const onFinish = (values) => {
    const user = {
      name: values.username,
      pass: values.password,
      rol: [...values.permissions]
    };
    adminApi.createUser(user).then(res => {
      updateTable(res.data);
    }).catch(err => {
      console.log(err)
      alert(err);
    })
  };

  useEffect(() => {
    setUsersLoading(true);
    adminApi.getUserList().then((res) => {
      updateTable(res.data);

    }).catch(err => {
      const mes = err.response.data?.error || "unknown ERROR";
      alert(mes)
    }).finally(() => {
      setUsersLoading(false);
    });
  }, [])
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form form={form} name="dynamic_form_complex" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="Username"
            name="username"
            rules={[
              {
                required: true,
                message: 'Please input your username!',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: 'Please input your password!',
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.List name="permissions">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline">
                    <Form.Item
                      // name='Laval'
                      name={[field.name, 'laval']}
                      label="Laval"
                      rules={[
                        {
                          required: true,
                          message: 'Missing area',
                        },
                      ]}
                    >
                      <Select style={{ width: 120 }} options={laval} />
                    </Form.Item>
                    <Form.Item
                      // name="language"
                      name={[field.name, 'language']}
                      label="Language"
                      rules={[
                        {
                          required: true,
                          message: 'Missing area',
                        },
                      ]}
                    >
                      <Select style={{ width: 120 }} options={language} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  </Space>
                )
                )}

                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add permission
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add New User
            </Button>
          </Form.Item>
        </Form>
      </Col>
      <Col span={12}>
        <Table
          pagination={false}
          columns={columns}
          dataSource={users}
        />
      </Col>
    </Row>
  );
};