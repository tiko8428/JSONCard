import {useState} from "react";
import {
  UserOutlined
} from '@ant-design/icons';
import { Breadcrumb, Layout, Menu } from 'antd';
import { Typography } from 'antd';
import UserController from "../userController";

const { Title } = Typography;


const items2 = [
  {
    label: 'User', type: 'group', key: 'item-1', mode: "vertical", icon: <UserOutlined />,
    children: [

      { label: 'dashboard', key: 'dashboard', onClick:()=>{console.log("login")} },
      { label: 'Logout', key: 'Logout', onClick:()=>{console.log("login")} },
    {  type: 'divider',  }
    ],
  }, // remember to pass the key prop
  // { label: 'item 2', key: 'item-2' }, // which is required
  {
    label: 'A1',
    key: 'A1',
    // disabled: true,
    children: [
      { label: 'de', key: 'A1/de' },
      { label: 'au', key: 'A1/au' },
      { label: 'ru', key: 'A1/ru' },
      { label: 'en', key: 'A1/en' },
    ],
  },
  {
    label: 'A2',
    key: 'A2',
    // disabled: true,
    children: [
      { label: 'de', key: 'A2/de' },
      { label: 'au', key: 'A2/au' },
      { label: 'ru', key: 'A2/ru' },
      { label: 'en', key: 'A2/en' },
    ],
  },
  {
    label: 'B1',
    key: 'B1',
    // disabled: true,
    children: [
      { label: 'de', key: 'B1/de' },
      { label: 'au', key: 'B1/au' },
      { label: 'ru', key: 'B1/ru' },
      { label: 'en', key: 'B1/en' },
    ],
  },
  {
    label: 'B2',
    key: 'B2',
    // disabled: true,
    children: [
      { label: 'de', key: 'B2/de' },
      { label: 'au', key: 'B2/au' },
      { label: 'ru', key: 'B2/ru' },
      { label: 'en', key: 'B2/en' },
    ],
  },
  
  {
    label: 'C1',
    key: 'C1',
    // disabled: true,
    children: [
      { label: 'de', key: 'C1/de' },
      { label: 'au', key: 'C1/au' },
      { label: 'ru', key: 'C1/ru' },
      { label: 'en', key: 'C1/en' },
    ],
  },
];
export const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState(""); 
  const { Header, Content, Sider } = Layout;
  return (
    <Layout style={{ height: "100%" }}>
      <Header className="header">
        <div>
          <Title level={2} style={{ color: "#fff", padding: 0, margin: 0 }}> App data admin panel </Title>
        </div>
      </Header>
      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            onClick={(props)=>{
              setCurrentPage(props.key)
            }}
            defaultSelectedKeys={['1']}
            // defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderRight: 0 }}
            items={items2}
          />
        </Sider>

        <Layout style={{ padding: '0 24px 24px' }}>
          <Breadcrumb
            style={{
              margin: '16px 0',
            }}
          >
            <Breadcrumb.Item>{currentPage}</Breadcrumb.Item>
          </Breadcrumb>
          <Content
            className="site-layout-background"
            style={{
              // padding: 24,
              margin: 0,
              // minHeight: 280,
            }}
          >
            <UserController/>
          </Content>
        </Layout>
      </Layout>
    </Layout>

  )
}