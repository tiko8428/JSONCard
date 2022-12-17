import axios from "axios"
import { notification } from 'antd';

class AdminApi {
  constructor() {
    this.api = axios.create({
      baseURL: "/api/admin",
    });
  }

  getUserList(key) {
    return this.api.get("users", { params: { adminKey: key } })
  }

  createUser(data, key) {
    return this.api.post(`create-user`,
      { body: { ...data } },
      { params: { adminKey: key } }
    )
  }

  deleteUser({ userKey, activeUserKey }) {
    return this.api.delete("delete-user", {
      params: {
        adminKey: activeUserKey,
        deleteUser: userKey
      }
    })
  }
  downloadJson(adminKey,laval, language ){
    return this.api.get(`/download?language=${language}&laval=${laval}&adminKey=${adminKey}`);
  }
}

export const adminApi = new AdminApi();