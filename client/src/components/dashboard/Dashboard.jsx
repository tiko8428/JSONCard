import { useState, memo, useContext, useMemo } from "react";
import { Layout, Menu } from 'antd';

import UserController from "../userController";
import { getRouter } from "./router";
import { UserContext } from "../../App";
import Login from "../login";
import JsonTable from "../jsonTable";


const ADashboard = () => {
  const [currentPage, setCurrentPage] = useState("");
  const { Content, Sider } = Layout;
  const { user, setUser } = useContext(UserContext)
  const [collapsed, setCollapsed] = useState(false);
  const router = useMemo(() => getRouter(user), [user])

  const mainRender = () => {
    if (user?.rol && !currentPage) {
      return null
    }
    if (!user?.rol) {
      return <Login />
    };
    switch (currentPage) {
      case "users":
        return <UserController />;
      case "login": return <Login />;
      case "logout":
        setUser(null);
        localStorage.removeItem("user");
        return <Login />
      default:
        return <JsonTable json={currentPage} />
    }
  }
  return (
    <Layout style={{ height: "100%" }}>
      {/* <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="header" >
        <Title level={3} style={{ color: "#ccc", padding: 0, margin: 0 }}> {user ? user.name : null}</Title>
        <HeaderMnu />
      </Header>  */}
      <Layout>
        <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} width={200} className="site-layout-background">
          <Menu
            mode="inline"
            onClick={(props) => {
              setCurrentPage(props.key)
              if (props.key === "logout") {
                alert("logout");
              }
            }}
            defaultSelectedKeys={['0']}
            style={{ height: '100%', borderRight: 0 }}
            items={router}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            className="site-layout-background"
            style={{
              margin: 0,
              marginTop: 20,
            }}
          >
            {mainRender()}
          </Content>
        </Layout>
      </Layout>
    </Layout>

  )
}

export const Dashboard = memo(ADashboard);
