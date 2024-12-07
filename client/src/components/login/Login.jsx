import { useEffect, useState, useContext } from "react";
import axios from "axios";
import React from 'react';
import { Button, Form, Input } from 'antd';
import { notification } from 'antd';
import {UserContext} from "../../App";


export const Login = () => {
  const [disabled, setDisabled] = useState(false);
  const {user, setUser} = useContext(UserContext);

  const onFinish = (values) => {
    setDisabled(true);
    axios.get(`/api/login?name=${values.username}&pass=${values.password}`).then(res => {
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      return res;
    }).catch(err => {
      if (err.response.data?.error) {
        notification.error({
          message: "LOGIN ERROR",
          description: err.response.data.error,
        });
      } else {
        notification.error({
          message: "LOGIN ERROR",
          description: err.response.data.error,
        });
      }
      return err;
    }).finally(() => {
      setDisabled(false);
    })
  };

  // const onFinishFailed = (errorInfo) => {
  //   console.log('Failed:', errorInfo);
  // };

  return (
    <Form
      disabled = {disabled}
      name="basic"
      labelCol={{
        span: 4,
      }}
      wrapperCol={{
        span: 10,
      }}
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      // onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
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

      <Form.Item
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Button type="primary" htmlType="submit">
          LOGIN
        </Button>
      </Form.Item>
    </Form>
  );
};
