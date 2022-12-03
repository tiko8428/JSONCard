import axios from "axios"

class AdminApi {
  constructor() {
    this.api = axios.create({
      baseURL: "/api/admin",
      params: {
        adminKey: "testKey"
      }
    });
  }

  getUserList() {
    return this.api.get("users")
  }

  createUser(data) {
    return this.api.post("create-user", {
      body: {
        ...data
      }
    })
  }

  deleteUser(key){
    return this.api.delete("delete-user",{
      params: {
        key
      }
    })
  }
}

export const adminApi = new AdminApi();