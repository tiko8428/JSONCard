import axios from "axios"

class CommonApi {
  constructor() {
    this.api = axios.create({
      baseURL: "/api/user",
    });
  }
  getJson(props) {
    return this.api.get("/jsonData", {
      params: { ...props }
    })
  }

  createItem({key, laval, language, data}){
    return this.api.post("/create-item", {
      body: { laval, language, data },
      params:{ key }
    })
  }
}

export const commonApi = new CommonApi();