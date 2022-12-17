import { useEffect, useState, useContext } from "react";
import { UserContext } from "../../App";
import { commonApi } from "../../api/common";
import { adminApi } from "../../api/admin";
import { Table, notification, Row, Button } from 'antd';
import CreatePopup from "../createPopup";


export const JsonTable = (props) => {
  const { json } = props;
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [openCreate, setOpenCrate] = useState(false);

  const getColumns = (user) => {
    const deleteColumn = {
      title: 'delete',
      dataIndex: 'delete',
      key: 'delete',
      fixed: 'right',
      width: 100,
      render: (text, record) => <Button onClick={() => { commonApi.deleteItem(record, user) }}>delete</Button>,
    };

    const columns = [
      {
        title: 'CN',
        dataIndex: 'cardNumber',
        key: 'cardNumber',
        width: 50,
        fixed: 'left',
      },
      {
        title: 'field1',
        dataIndex: 'field1',
        key: 'field1',
        // width: 100,
      },
      {
        title: 'field2',
        dataIndex: 'field2',
        key: 'field2',
        // width: 100,
      },
      {
        title: 'field3',
        dataIndex: 'field3',
        key: 'field3',
        // width: 100,
      },
      {
        title: 'field4',
        dataIndex: 'field4',
        key: 'field4',
        // width: 300,
      },
      {
        title: 'field5',
        dataIndex: 'field5',
        key: 'field5',
        // width: 100,
      },
      {
        title: 'field6',
        dataIndex: 'field6',
        key: 'field6',
        // width: 100,
      },
      {
        title: 'category',
        dataIndex: 'category',
        key: 'category',
        // width: 100,
      },
      {
        title: 'Edit',
        dataIndex: 'Edit',
        key: 'Edit',
        fixed: 'right',
        width: 80,
        render: (text, record) => {
          return <Button onClick={() => { console.log(record) }}> edit</Button >
        },
      },
    ]
    if (user && user.rol === "admin") {
      columns.push(deleteColumn);
    }
    return columns
  }

  const updateTable = () => {
    // check permitions
    setData([]);
    const [laval, language] = json.split("/");
    commonApi.getJson({ laval, language }).then(res => {
      let newData = [];
      for (let key in res.data) {
        const item = res.data[key];
        newData.push({ ...item, key: item.cardNumber })
      }
      console.log(newData);
      setData(newData);
    }).catch(err => {
      notification.error({
        message: "TABLE DATA LOADING",
        description: "ups.....",
      });
    });
  }

  const onCreate = (values) => {
    console.log('Received values of form: ', values);
    const [laval, language] = json.split("/");
    commonApi.createItem({ key: user.key, laval, language, data: values }).then(res => {
      updateTable();
    }).catch(err => {
      notification.error({
        message: "Create item",
        description: "Create item ERROR",
      });
    });
    setOpenCrate(false);
  };

  const onDownload = () => {
    const [laval, language] = json.split("/");
    adminApi.downloadJson(user.key, laval, language)
      .then((res) => {
        const filename = `${json}.json`;
        const textInput = JSON.stringify(res.data);
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(textInput));
        element.setAttribute('download', filename);
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        return res
      })
      .catch((err) => {
        notification.error({
          message: "Cen't DOWNLOAD",
          description: "server Error cen't DOWNLOAD",
        });
        return err
      })
      .finally((final) => {
        return final
      });
  }

  useEffect(() => {
    if (user || user.key) {
      updateTable();
    }
  }, [json])

  if (!user || !user.key) {
    return <div><p style={{ color: "red", fontSize: "25px" }}>something has gone wrong please try login again.</p></div>
  }
  return (
    <div>
      <Row align={"middle"} style={{ marginBottom: 15 }}>
        {
          (user && user.rol === "admin") &&
          (
            <div>
              <Button type="primary" onClick={() => { setOpenCrate(true) }}>CREATE</Button>
              <Button style={{ marginLeft: 20 }} onClick={onDownload}>Download</Button>
              <CreatePopup
                json={json}
                open={openCreate}
                onCreate={onCreate}
                onCancel={() => {
                  setOpenCrate(false);
                }}
              />
            </div>
          )
        }
      </Row>
      <Table
        // pagination={false}
        style={{ overflowY: "auto" }}
        columns={getColumns(user)}
        dataSource={data}
        bordered
        pagination={{ defaultPageSize: 50, showSizeChanger: false }}
        size="middle"
        scroll={{
          x: 'calc(700px + 50%)',
          y: "calc(100vh - 235px)",
        }}
      />
    </div>
  )
}