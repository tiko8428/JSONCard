import { useEffect, useState, useContext } from "react";
import { UserContext } from "../../App";
import { commonApi } from "../../api/common";
import { adminApi } from "../../api/admin";
import { Table, notification, Row, Col, Button } from 'antd';
import CreatePopup from "../createPopup";
import TranslatePopup from "../translatePopup";
import EditPopup from "../editPopup";


export const JsonTable = (props) => {
  const { json } = props;
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [selectedRow, setSelectedRow] = useState();
  const [openCreate, setOpenCrate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openTranslate, setOpenTranslate] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState();
  const [editRecord, setEditRecord] = useState();
  const [laval, language] = json.split("/");

  const getColumns = (user) => {
    const deleteColumn = {
      title: 'delete',
      dataIndex: 'delete',
      key: 'delete',
      fixed: 'right',
      width: 100,
      render: (text, record) => (
        <Button onClick={() => {
          const confirmDelete = window.confirm("Are you sure about DELETE?");
          if (confirmDelete) {
            adminApi.deleteItem({ adminKey: user.key, item: record, laval, language }).then(() => {
              updateTable()
            }).catch(err => {
              console.log("ERROR", err)
            })
          }
        }
        }>delete</Button>),
    };
    const editColumn = {
      title: 'Edit',
      dataIndex: 'Edit',
      key: 'Edit',
      fixed: 'right',
      width: 80,
      render: (text, record) => {
        return <Button onClick={() => {
          setOpenEdit(true);
          setEditRecord(record);
        }}> edit</Button >
      },
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
      },
      {
        title: 'field2',
        dataIndex: 'field2',
        key: 'field2',
      },
      {
        title: 'field3',
        dataIndex: 'field3',
        key: 'field3',
      },
      {
        title: 'field4',
        dataIndex: 'field4',
        key: 'field4',
      },
      {
        title: 'field5',
        dataIndex: 'field5',
        key: 'field5',
      },
      {
        title: 'field6',
        dataIndex: 'field6',
        key: 'field6',
      },
      {
        title: 'category',
        dataIndex: 'category',
        key: 'category',
      },
    ]
    if (user && user.rol === "admin") {
      columns.push(editColumn, deleteColumn);

    } else if (language !== "de") {
      columns.push(editColumn, deleteColumn);
    }
    return columns
  }

  const updateTable = () => {
    setData([]);
    commonApi.getJson({ laval, language }).then(res => {
      let newData = [];
      const data = JSON.parse(res.data);
      for (let key in data) {
        const item = data[key];
        newData.push({ ...item, key: item.cardNumber })
      }
      setData(newData);
    }).catch(err => {
      notification.error({
        message: "TABLE DATA LOADING",
        description: "ups.....",
      });
    });
  }

  const onCreate = (values) => {
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

  const onTranslate = ({ values, language, laval }) => {
    commonApi.translate({ values, language, laval }).then(res => {
      setOpenTranslate(false);
      setTargetLanguage(undefined);
    }).catch(err => {
      notification.error({
        message: "translate item",
        description: "Translate item ERROR",
      });
    });
    // save data
  }

  const onEdit = (values) => {
    commonApi.edit({language, laval, values, originCardNumber: editRecord.cardNumber }).then(res=>{
      setOpenEdit(false);
      updateTable();
    }).catch(err=>{
      notification.error({
        message: "Edit item",
        description: "Edit item ERROR",
      });
    })
  }

  const onDownload = () => {
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
  }, [json, user])

  if (!user || !user.key) {
    return <div><p style={{ color: "red", fontSize: "25px" }}>something has gone wrong please try login again.</p></div>
  }

  const translateButtons = () => {
    const TranslateButton = (key, item) => {
      return (
        <Button
          key={key}
          name={key}
          style={{ textTransform: "uppercase", marginRight: 10 }}
          onClick={(e) => {
            if (selectedRow) {
              const { name } = e.currentTarget;
              setTargetLanguage(name);
              setOpenTranslate(true);
            } else {
              alert("pleas select the row");
            }
          }}
        >
          TRANSLATE TO {item}
        </Button>
      )
    }
    if (!user) return null;
    if (user?.rol === "admin") {
      return ["ua", "ru", "en", "de"].map((item) => {
        if (language !== item) {
          return TranslateButton(item, item);
        } else {
          return null
        }
      })
    }
    if (user?.rol.length > 0) {
      return user.rol.map((rol) => {
        if (language !== rol.language && rol.language !== "de") {
          return TranslateButton(rol.language, rol.language);
        } else {
          return null
        }
      })
    }
  }
  return (
    <div>
      <Row align={"middle"} style={{ marginBottom: 15 }}>
        <CreatePopup
          json={json}
          open={openCreate}
          onCreate={onCreate}
          onCancel={() => { setOpenCrate(false) }}
        />
        {openTranslate &&
          <TranslatePopup
            json={json}
            originData={selectedRow}
            targetLanguage={targetLanguage}
            open={openTranslate}
            onTranslate={onTranslate}
            onCancel={() => { setOpenTranslate(false) }}
          />
        }
        {
          editRecord &&
          <EditPopup
            json={json}
            open={openEdit}
            record={editRecord}
            onEdit={onEdit}
            onCancel={() => { setOpenEdit(false) }}
          />
        }

        <Col> {translateButtons()} </Col>
        {
          (user && user.rol === "admin") &&
          (
            <Col style={{ marginLeft: "auto" }}>
              <Button type="primary" onClick={() => { setOpenCrate(true) }}>CREATE</Button>
              <Button style={{ marginLeft: 20 }} onClick={onDownload}>Download</Button>
            </Col>
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
          y: "calc(100vh - 180px)",
        }}
        rowSelection={{
          type: "radio",
          onChange: (cardNumber, itemDataArray) => {
            setSelectedRow(itemDataArray[0]);
          },
        }}
      />
    </div>
  )
}