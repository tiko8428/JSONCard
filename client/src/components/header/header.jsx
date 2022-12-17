import { Button, Space } from 'antd';
import { useContext } from "react";
import { UserContext } from "../../App";

export const Header = () => {
  const { user, setUser } = useContext(UserContext);
  const handelLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };
  if (!user?.rol) {
    return <button>login</button>
  } else {
    return (
      <Space wrap>
        <Button onClick={handelLogout} type="primary">LogOut</Button>
      </Space>
    )
  }
} 